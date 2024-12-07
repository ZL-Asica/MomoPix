import { Box, Pagination, MenuItem, Select, Typography } from '@mui/material';

import BulkActionMenu from './BulkActionMenu';

import { ITEMS_PER_PAGE_OPTIONS } from '@/consts';

interface PaginationControlsProperties {
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  albumName?: string;
  selectedItems?: Photo[];
  children?: React.ReactNode;
}

const PaginationControls = ({
  totalPages,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  albumName,
  selectedItems,
  children,
}: PaginationControlsProperties) => {
  const hasBulkActions = selectedItems && selectedItems.length > 0;

  return (
    <Box
      display='flex'
      flexDirection='column'
      gap={3}
      sx={{
        mb: 3,
        width: '100%',
      }}
    >
      {/* Top Controls */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
      >
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(_, page) => onPageChange(page)}
        />
        <Box
          display='flex'
          alignItems='center'
          gap={2}
        >
          {hasBulkActions && (
            <Box
              display='flex'
              alignItems='center'
              gap={1}
            >
              <Typography variant='body2'>
                已选中 {selectedItems.length} 项
              </Typography>
              <BulkActionMenu
                albumName={albumName || ''}
                selectedItems={selectedItems}
              />
            </Box>
          )}
        </Box>
        <Select
          value={itemsPerPage}
          onChange={(event) => onItemsPerPageChange(Number(event.target.value))}
          size='small'
        >
          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
            <MenuItem
              key={option}
              value={option}
            >
              每页 {option} 张
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Custom Content */}
      {children && (
        <Box
          sx={{
            mt: 2,
            width: '100%',
          }}
        >
          {children}
        </Box>
      )}

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          sx={{
            mt: 2,
          }}
        >
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => onPageChange(page)}
          />
        </Box>
      )}
    </Box>
  );
};

export default PaginationControls;
