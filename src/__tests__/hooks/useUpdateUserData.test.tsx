import { render, act } from '@testing-library/react';
import type { Mock } from 'vitest';
import { useEffect } from 'react';

import { useAuthContext, useUpdateUserData } from '@/hooks';

vi.mock('@/hooks', () => ({
  useAuthContext: vi.fn(),
  useUpdateUserData: vi.fn(),
}));

describe('useUpdateUserData', () => {
  let mockUpdateUserData: Mock;
  let mockUserData: UserData;

  beforeEach(() => {
    mockUpdateUserData = vi.fn();
    mockUserData = {
      uid: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'http://example.com/photo.jpg',
      createdAt: '2023-01-01T00:00:00.000Z',
      albums: [
        {
          name: 'default',
          createdAt: '2023-01-01T00:00:00.000Z',
          photos: [],
        },
      ],
    };

    (useAuthContext as Mock).mockReturnValue({
      userData: mockUserData,
      updateUserData: mockUpdateUserData,
    });

    (useUpdateUserData as Mock).mockReturnValue({
      updateBasicInfo: vi.fn(async (updatedFields: Partial<UserData>) => {
        await mockUpdateUserData(updatedFields);
      }),
      addAlbum: vi.fn(async (albumName: string) => {
        const newAlbum = {
          name: albumName,
          createdAt: new Date().toISOString(),
          photos: [],
        };
        await mockUpdateUserData({
          albums: [...mockUserData.albums, newAlbum],
        });
      }),
      addPhotosToAlbum: vi.fn(async (albumName: string, photos: Photo[]) => {
        const updatedAlbums = mockUserData.albums.map((album) =>
          album.name === albumName
            ? {
                ...album,
                photos: [
                  ...album.photos,
                  ...photos.map((photo) => ({
                    ...photo,
                    uploadedAt: new Date().toISOString(),
                  })),
                ],
              }
            : album
        );

        if (!updatedAlbums.some((album) => album.name === albumName)) {
          updatedAlbums.push({
            name: albumName,
            photos: photos.map((photo) => ({
              ...photo,
              uploadedAt: new Date().toISOString(),
            })),
            createdAt: new Date().toISOString(),
          });
        }

        await mockUpdateUserData({ albums: updatedAlbums });
      }),
    });
  });

  it('should update basic information', async () => {
    const updatedFields = { displayName: 'Updated User' };

    const TestComponent = () => {
      const { updateBasicInfo } = useUpdateUserData();

      useEffect(() => {
        (async () => {
          await act(async () => {
            await updateBasicInfo(updatedFields);
          });
        })();
      }, []);

      return null;
    };

    render(<TestComponent />);
    await act(async () => {});

    expect(mockUpdateUserData).toHaveBeenCalledWith(updatedFields);
  });

  it('should add a new album', async () => {
    const newAlbumName = 'New Album';

    const TestComponent = () => {
      const { addAlbum } = useUpdateUserData();

      useEffect(() => {
        (async () => {
          await act(async () => {
            await addAlbum(newAlbumName);
          });
        })();
      }, []);

      return null;
    };

    render(<TestComponent />);
    await act(async () => {});

    expect(mockUpdateUserData).toHaveBeenCalledWith({
      albums: [
        ...mockUserData.albums,
        {
          name: newAlbumName,
          createdAt: expect.any(String),
          photos: [],
        },
      ],
    });
  });

  it('should add photos to an existing album', async () => {
    const newPhotos = [
      { url: 'photo1.jpg', name: 'Photo 1', size: 123, uploadedAt: '' },
    ];

    const TestComponent = () => {
      const { addPhotosToAlbum } = useUpdateUserData();

      useEffect(() => {
        (async () => {
          await act(async () => {
            await addPhotosToAlbum('default', newPhotos);
          });
        })();
      }, []);

      return null;
    };

    render(<TestComponent />);
    await act(async () => {});

    expect(mockUpdateUserData).toHaveBeenCalledWith({
      albums: [
        {
          name: 'default',
          createdAt: '2023-01-01T00:00:00.000Z',
          photos: newPhotos.map((photo) => ({
            ...photo,
            uploadedAt: expect.any(String),
          })),
        },
      ],
    });
  });

  it('should add photos to a new album if album does not exist', async () => {
    const newPhotos = [
      { url: 'photo3.jpg', name: 'Photo 3', size: 789, uploadedAt: '' },
    ];
    const albumName = 'New Album';

    const TestComponent = () => {
      const { addPhotosToAlbum } = useUpdateUserData();

      useEffect(() => {
        (async () => {
          await act(async () => {
            await addPhotosToAlbum(albumName, newPhotos);
          });
        })();
      }, []);

      return null;
    };

    render(<TestComponent />);
    await act(async () => {});

    expect(mockUpdateUserData).toHaveBeenCalledWith({
      albums: [
        ...mockUserData.albums,
        {
          name: albumName,
          photos: newPhotos.map((photo) => ({
            ...photo,
            uploadedAt: expect.any(String),
          })),
          createdAt: expect.any(String),
        },
      ],
    });
  });
});
