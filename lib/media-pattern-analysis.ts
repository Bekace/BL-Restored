// Let's extract the EXACT working pattern from media upload
export const WORKING_MEDIA_PATTERN = {
  // From media page - handleUploadComplete function
  handleUploadComplete: `
    const handleUploadComplete = () => {
      loadMediaFiles()
      setShowUploadDialog(false)
      triggerRefresh()
    }
  `,

  // From media page - loadMediaFiles function
  loadMediaFiles: `
    const loadMediaFiles = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/media")
        const data = await response.json()

        if (response.ok) {
          setMediaFiles(data.files || [])
          setError(null)
        } else {
          setError(data.error || "Failed to load media files")
        }
      } catch (err) {
        setError("Failed to load media files")
        console.error("Error loading media files:", err)
      } finally {
        setLoading(false)
      }
    }
  `,

  // From upload dialog - onUploadComplete call
  uploadComplete: `
    // In UploadMediaDialog component
    onUploadComplete() // This calls handleUploadComplete
  `,
}

export const CURRENT_USERS_PATTERN = {
  // Current users pattern
  handleUserCreated: `
    const handleUserCreated = async () => {
      await loadUsers()
      setCreateUserDialogOpen(false)
      triggerRefresh()
    }
  `,

  // Current loadUsers function
  loadUsers: `
    const loadUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/admin/users")
        const data = await response.json()

        if (response.ok) {
          setUsers(data.users || [])
          setError(null)
        } else {
          setError(data.message || "Failed to load users")
        }
      } catch (err) {
        setError("Failed to load users")
        console.error("Error loading users:", err)
      } finally {
        setLoading(false)
      }
    }
  `,
}

// The key difference analysis
export const PATTERN_DIFFERENCES = {
  async_handling: "Media: NOT async, Users: async with await",
  error_property: "Media: data.error, Users: data.message",
  data_property: "Media: data.files, Users: data.users",
  loading_state: "Both set loading state the same way",
}
