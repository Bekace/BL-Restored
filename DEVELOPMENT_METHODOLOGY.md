# Digital Signage Platform - Development Methodology

## 🎯 **Standard Development Pattern**

This document defines our proven methodology for adding new features to the platform, based on the successful media administration system.

---

## 📋 **Feature Development Checklist**

### **Phase 1: Database Setup**
- [ ] Create database tables/columns if needed
- [ ] Write SQL migration scripts
- [ ] Test database structure
- [ ] Ensure proper relationships and constraints

### **Phase 2: API Development**
- [ ] Create API endpoints following REST conventions:
  - `GET /api/admin/[resource]` - List all items
  - `POST /api/admin/[resource]/create` - Create new item
  - `PUT /api/admin/[resource]/[id]/edit` - Update existing item
  - `DELETE /api/admin/[resource]/[id]` - Delete item
- [ ] Implement proper authentication and authorization
- [ ] Add comprehensive error handling and logging
- [ ] Include data validation on server side
- [ ] Return consistent response format

### **Phase 3: Frontend Implementation**
- [ ] Create main page component with loading/error states
- [ ] Implement the **Media Administration Pattern**:
  - `refreshTrigger` state for data synchronization
  - `triggerRefresh()` function
  - `handleItemCreated()` callback
  - `handleItemUpdated()` callback  
  - `handleItemDeleted()` callback
- [ ] Add CRUD dialogs (Create, Edit, Delete confirmation)
- [ ] Implement real-time validation with error display
- [ ] Add search and filtering capabilities
- [ ] Include bulk operations if applicable
- [ ] Add export functionality

### **Phase 4: UI/UX Polish**
- [ ] Add loading spinners for all async operations
- [ ] Implement toast notifications for success/error feedback
- [ ] Ensure responsive design
- [ ] Add proper accessibility attributes
- [ ] Include confirmation dialogs for destructive actions

---

## 🔄 **The Media Administration Pattern**

### **Core State Management**
\`\`\`typescript
const [items, setItems] = useState([])
const [loading, setLoading] = useState(true)
const [refreshTrigger, setRefreshTrigger] = useState(0)

const triggerRefresh = () => {
  setRefreshTrigger((prev) => prev + 1)
}

const handleItemCreated = () => {
  loadItems()
  setCreateDialogOpen(false)
  triggerRefresh()
}

const handleItemUpdated = () => {
  loadItems()
  setEditDialogOpen(false)
  triggerRefresh()
}

const handleItemDeleted = () => {
  loadItems()
  triggerRefresh()
}
\`\`\`

### **API Call Pattern**
\`\`\`typescript
const createItem = async () => {
  try {
    setCreating(true)
    const response = await fetch('/api/admin/items/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      toast({ title: "Success", description: data.message })
      resetForm()
      handleItemCreated() // This triggers refresh
    } else {
      toast({ title: "Error", description: data.message, variant: "destructive" })
    }
  } catch (err) {
    toast({ title: "Error", description: "Network error", variant: "destructive" })
  } finally {
    setCreating(false)
  }
}
\`\`\`

---

## 📝 **Task Templates**

### **New Feature Task List**
1. **Database Design**
   - [ ] Design table structure
   - [ ] Create migration script: `scripts/add-[feature]-system.sql`
   - [ ] Test migration on development database

2. **API Development**
   - [ ] Create `app/api/admin/[feature]/route.ts` (GET, POST)
   - [ ] Create `app/api/admin/[feature]/[id]/route.ts` (DELETE)
   - [ ] Create `app/api/admin/[feature]/[id]/edit/route.ts` (PUT)
   - [ ] Add authentication middleware
   - [ ] Test all endpoints with proper error handling

3. **Frontend Development**
   - [ ] Create `app/dashboard/admin/[feature]/page.tsx`
   - [ ] Implement Media Administration Pattern
   - [ ] Add Create/Edit/Delete dialogs
   - [ ] Add search and filtering
   - [ ] Add bulk operations
   - [ ] Add export functionality

4. **Testing & Polish**
   - [ ] Test all CRUD operations
   - [ ] Verify real-time updates work
   - [ ] Test error handling
   - [ ] Ensure responsive design
   - [ ] Add loading states and feedback

### **Bug Fix Task List**
1. **Investigation**
   - [ ] Reproduce the issue
   - [ ] Identify root cause
   - [ ] Check if it affects other features

2. **Fix Implementation**
   - [ ] Apply fix following established patterns
   - [ ] Test fix thoroughly
   - [ ] Ensure no regression in other features

3. **Verification**
   - [ ] Test the specific bug scenario
   - [ ] Test related functionality
   - [ ] Verify UI/UX remains consistent

---

## 🏗️ **Architecture Principles**

### **1. Consistency**
- Always use the Media Administration Pattern for data management
- Follow the same API response format across all endpoints
- Use consistent naming conventions

### **2. Reliability**
- Server is the source of truth - always refresh from API
- Handle all error cases gracefully
- Provide clear user feedback for all operations

### **3. User Experience**
- Immediate visual feedback for all actions
- Loading states for async operations
- Confirmation dialogs for destructive actions
- Real-time validation with helpful error messages

### **4. Maintainability**
- Reuse established patterns and components
- Keep API endpoints RESTful and predictable
- Document any deviations from standard patterns

---

## 🚀 **Quick Start for New Features**

1. **Copy the Media Administration Pattern** from `app/dashboard/media/page.tsx`
2. **Adapt the API endpoints** following the user management example
3. **Update the database** with proper migration scripts
4. **Test thoroughly** using the checklist above
5. **Document any special considerations** in this file

This methodology ensures consistent, reliable, and maintainable code across the entire platform.
