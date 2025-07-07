import { Loader2, type LightbulbIcon as LucideProps } from "lucide-react"

export const Icons = {
  spinner: Loader2,
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 6v12a3 3 0 1 1-6 0V6a3 3 0 1 1 6 0z" />
      <path d="M3 18h18" />
    </svg>
  ),
}
