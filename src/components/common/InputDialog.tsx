import { SmallLoadingCircle } from '@/components'
import { asyncHandler } from '@/utils'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'

import { useEffect, useRef, useState } from 'react'

interface InputDialogProperties {
  open: boolean
  onClose: () => void
  title: string
  inputLabel: string
  handleSave: (value: string) => Promise<void>
  defaultValue?: string
}

function InputDialog({
  open,
  onClose,
  title,
  inputLabel,
  handleSave,
  defaultValue = '',
}: InputDialogProperties) {
  const [inputValue, setInputValue] = useState(defaultValue)
  const [loading, setLoading] = useState(false)
  const dialogReference = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  // Sync inputValue with defaultValue when the dialog is opened or the defaultValue changes
  useEffect(() => {
    if (open) {
      setInputValue(defaultValue)
      // Save the currently focused element before opening the dialog
      previouslyFocusedElement.current = document.activeElement as HTMLElement
    }
    else {
      // Restore focus to the previously focused element
      previouslyFocusedElement.current?.focus()
    }
  }, [defaultValue, open])

  const handleSaveClick = async () => {
    if (inputValue.trim()) {
      setLoading(true)
      await handleSave(inputValue.trim()) // Avoid empty or whitespace-only values
      setLoading(false)
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="input-dialog-title"
      ref={dialogReference}
    >
      <DialogTitle id="input-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <TextField
          label={inputLabel}
          value={inputValue}
          onChange={event => setInputValue(event.target.value)}
          fullWidth
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={asyncHandler(async () => {
            await handleSaveClick()
          })}
          color="primary"
          disabled={!inputValue.trim()} // Disable save button for invalid input
        >
          {loading ? <SmallLoadingCircle /> : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default InputDialog
