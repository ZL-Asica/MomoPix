import { DeletePhotosDialog, MovePhotoDialog } from '@/components'
import { asyncHandler, copyPhotoLinks } from '@/utils'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { IconButton, Menu, MenuItem } from '@mui/material'

import { useToggle } from '@zl-asica/react'
import { useState } from 'react'

interface BulkActionMenuProperties {
  albumName: string
  selectedItems: Photo[]
}

function BulkActionMenu({
  albumName,
  selectedItems,
}: BulkActionMenuProperties) {
  const [openMoveDialog, toggleMoveDialog] = useToggle()
  const [openDeleteDialog, toggleDeleteDialog] = useToggle()
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  return (
    <>
      <IconButton
        onClick={handleMenuOpen}
        aria-label="Bulk actions"
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClick={handleMenuClose}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={toggleMoveDialog}>一键移动</MenuItem>
        <MenuItem
          onClick={asyncHandler(async () => {
            await copyPhotoLinks(selectedItems, 'direct')
          })}
        >
          复制图片链接
        </MenuItem>
        <MenuItem
          onClick={asyncHandler(async () => {
            await copyPhotoLinks(selectedItems, 'html')
          })}
        >
          复制 HTML
        </MenuItem>
        <MenuItem
          onClick={asyncHandler(async () => {
            await copyPhotoLinks(selectedItems, 'markdown')
          })}
        >
          复制 Markdown
        </MenuItem>
        <MenuItem
          onClick={asyncHandler(async () => {
            await copyPhotoLinks(selectedItems, 'bbcode')
          })}
        >
          复制 BBCode
        </MenuItem>
        <MenuItem onClick={toggleDeleteDialog}>一键删除</MenuItem>
      </Menu>

      <MovePhotoDialog
        albumName={albumName}
        photo={selectedItems}
        open={openMoveDialog}
        onClose={toggleMoveDialog}
      />

      <DeletePhotosDialog
        albumName={albumName}
        photos={selectedItems}
        open={openDeleteDialog}
        onClose={toggleDeleteDialog}
      />
    </>
  )
}

export default BulkActionMenu
