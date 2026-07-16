import type { ImageRecord } from './types'
import { and, asc, eq, lt, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db/client'
import { imagesTable, orphanImageCleanupTable, storageReservationsTable } from '@/lib/db/schema'
import { deleteImageObject } from './r2Repo'

const UPLOAD_RESERVATION_GRACE_MS = 15 * 60 * 1000
const UPLOAD_RECONCILIATION_LIMIT = 3

async function recordOrphanUploadCleanup(objectKey: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error)
  await getDb()
    .insert(orphanImageCleanupTable)
    .values({
      objectKey,
      cleanupAttempts: 1,
      cleanupError: message.slice(0, 500),
      createdAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: orphanImageCleanupTable.objectKey,
      set: {
        cleanupAttempts: sql`${orphanImageCleanupTable.cleanupAttempts} + 1`,
        cleanupError: message.slice(0, 500),
      },
    })
}

async function imageMetadataExists(objectKey: string): Promise<boolean> {
  const [image] = await getDb()
    .select({ id: imagesTable.id })
    .from(imagesTable)
    .where(eq(imagesTable.id, objectKey))
    .limit(1)
  return image !== undefined
}

async function uploadMetadataMatches(image: ImageRecord): Promise<boolean> {
  const [storedImage] = await getDb()
    .select({ id: imagesTable.id })
    .from(imagesTable)
    .where(and(
      eq(imagesTable.id, image.objectKey),
      eq(imagesTable.albumId, image.albumId),
      eq(imagesTable.bytes, image.sizeBytes),
      eq(imagesTable.storedName, image.storedName),
      eq(imagesTable.source, image.source),
      eq(imagesTable.thumbnailObjectKey, image.thumbnail?.objectKey ?? ''),
      eq(imagesTable.thumbnailBytes, image.thumbnail?.sizeBytes ?? 0),
      eq(imagesTable.createdAt, Date.parse(image.createdAt)),
    ))
    .limit(1)
  return storedImage !== undefined
}

function parseReservedAssetKeys(objectKey: string, value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value) as unknown
    if (Array.isArray(parsed)) {
      const keys = parsed.filter((item): item is string => typeof item === 'string' && item.length > 0)
      if (keys.length > 0) {
        return [...new Set(keys)]
      }
    }
  }
  catch {
    // Legacy or malformed rows still retain the canonical key as a safe fallback.
  }
  return [objectKey]
}

export type ImageMetadataState = 'present' | 'absent' | 'unknown'

/**
 * Determines whether a previously attempted image metadata write committed.
 *
 * An unavailable D1 response returns `unknown` so callers retain the quota
 * reservation and defer destructive cleanup to reconciliation.
 */
export async function getImageMetadataState(image: ImageRecord): Promise<ImageMetadataState> {
  try {
    return await uploadMetadataMatches(image) ? 'present' : 'absent'
  }
  catch (error) {
    console.error('[uploadImageFn] Failed to determine whether metadata committed:', error)
    return 'unknown'
  }
}

/** Removes the temporary quota reservation for one canonical hosted image key. */
export async function releaseStorageReservation(objectKey: string): Promise<void> {
  await getDb().delete(storageReservationsTable).where(eq(storageReservationsTable.objectKey, objectKey))
}

/**
 * Deletes all uncommitted R2 assets while retaining quota for any failed delete.
 */
export async function cleanupUncommittedUpload(
  r2: R2Bucket,
  reservationKey: string,
  assetKeys: readonly string[],
  cause: unknown,
): Promise<void> {
  const failedKeys: string[] = []
  for (const assetKey of [...new Set(assetKeys)]) {
    try {
      await deleteImageObject(r2, assetKey)
      await getDb().delete(orphanImageCleanupTable).where(eq(orphanImageCleanupTable.objectKey, assetKey))
    }
    catch (cleanupError) {
      failedKeys.push(assetKey)
      try {
        await recordOrphanUploadCleanup(assetKey, cleanupError)
      }
      catch (recordError) {
        console.error('[uploadImageFn] Failed to record orphan upload cleanup:', recordError)
      }
      console.error('[uploadImageFn] Failed to clean uncommitted upload asset:', cause, cleanupError)
    }
  }

  if (failedKeys.length === 0) {
    await releaseStorageReservation(reservationKey)
  }
}

/**
 * Reconciles a bounded set of stale reservations and orphan upload markers.
 */
export async function reconcilePendingUploads(
  r2: R2Bucket,
  limit = UPLOAD_RECONCILIATION_LIMIT,
): Promise<void> {
  const db = getDb()
  const cutoff = Date.now() - UPLOAD_RESERVATION_GRACE_MS
  const boundedLimit = Math.max(1, Math.min(10, limit))
  const [reservations, orphanMarkers] = await Promise.all([
    db
      .select({
        objectKey: storageReservationsTable.objectKey,
        assetKeysJson: storageReservationsTable.assetKeysJson,
      })
      .from(storageReservationsTable)
      .where(lt(storageReservationsTable.createdAt, cutoff))
      .orderBy(asc(storageReservationsTable.createdAt), asc(storageReservationsTable.objectKey))
      .limit(boundedLimit),
    db
      .select({ objectKey: orphanImageCleanupTable.objectKey })
      .from(orphanImageCleanupTable)
      .orderBy(asc(orphanImageCleanupTable.createdAt), asc(orphanImageCleanupTable.objectKey))
      .limit(boundedLimit),
  ])

  const reservationByKey = new Map(reservations.map(reservation => [reservation.objectKey, reservation]))
  const objectKeys = [...new Set([...reservationByKey.keys(), ...orphanMarkers.map(marker => marker.objectKey)])]

  for (const objectKey of objectKeys) {
    try {
      if (await imageMetadataExists(objectKey)) {
        await releaseStorageReservation(objectKey)
        await db.delete(orphanImageCleanupTable).where(eq(orphanImageCleanupTable.objectKey, objectKey))
        continue
      }
      const reservation = reservationByKey.get(objectKey) ?? (await db
        .select({
          objectKey: storageReservationsTable.objectKey,
          assetKeysJson: storageReservationsTable.assetKeysJson,
        })
        .from(storageReservationsTable)
        .where(eq(storageReservationsTable.objectKey, objectKey))
        .limit(1))[0]
      const assetKeys = reservation === undefined
        ? [objectKey]
        : parseReservedAssetKeys(objectKey, reservation.assetKeysJson)
      await cleanupUncommittedUpload(r2, objectKey, assetKeys, new Error('Reconciliation cleanup'))
    }
    catch (error) {
      try {
        await recordOrphanUploadCleanup(objectKey, error)
      }
      catch (recordError) {
        console.error('[listImagesFn] Failed to record upload reconciliation error:', recordError)
      }
    }
  }
}
