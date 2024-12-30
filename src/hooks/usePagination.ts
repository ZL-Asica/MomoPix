import { useState } from 'react'

/**
 * Hook to handle pagination logic
 * @param items - The full array of items to paginate
 * @param initialItemsPerPage - The number of items per page by default
 */
function usePagination<T>(items: T[], initialItemsPerPage = 20) {
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)
  const [currentPage, setCurrentPage] = useState(1)

  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const totalPages = Math.ceil(items.length / itemsPerPage)

  return {
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages,
  }
}

export default usePagination
