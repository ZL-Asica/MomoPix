import { Box, Pagination, MenuItem, Select } from '@mui/material';

import { ITEMS_PER_PAGE_OPTIONS } from '@/consts';

interface PaginationControlsProperties {
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  children?: React.ReactNode;
}

const PaginationControls = ({
  totalPages,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  children,
}: PaginationControlsProperties) => {
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
          display='flex'
          justifyContent='center'
          alignItems='center'
          sx={{
            mt: 2,
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
