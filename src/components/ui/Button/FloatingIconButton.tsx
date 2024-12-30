import type { SxProps, Theme } from '@mui/material'
import type { MouseEventHandler, ReactNode } from 'react'
import { Box, IconButton } from '@mui/material'

interface FloatingIconButtonProperties {
  children: ReactNode
  onClick?: MouseEventHandler<HTMLElement>
  position?: { top?: number, right?: number, bottom?: number, left?: number }
  background?: string
  size?: number
  disabled?: boolean
  sx?: SxProps<Theme>
}

const defaultPosition = { top: 8, right: 8 }

function FloatingIconButton({
  children,
  onClick,
  position = defaultPosition,
  background,
  size = 32,
  disabled = false,
  sx,
}: FloatingIconButtonProperties) {
  return (
    <Box
      sx={{
        position: 'absolute',
        ...position,
        zIndex: 10,
        background:
          (background ?? '')
          || (theme =>
            theme.palette.mode === 'dark'
              ? 'rgba(0, 0, 0, 0.6)' // half-transparent black
              : 'rgba(255, 255, 255, 0.8)'), // half-transparent white
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        ...sx,
      }}
    >
      <IconButton
        onClick={onClick}
        size="small"
        disabled={disabled}
        sx={{ p: 0 }}
      >
        {children}
      </IconButton>
    </Box>
  )
}

export default FloatingIconButton
