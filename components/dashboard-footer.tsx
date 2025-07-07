"use client"

export function DashboardFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>© 2024 SignageCloud. All rights reserved.</div>
        <div className="flex items-center space-x-4">
          <a href="#" className="hover:text-gray-700">
            Support
          </a>
          <a href="#" className="hover:text-gray-700">
            Privacy
          </a>
          <a href="#" className="hover:text-gray-700">
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
}
