import { forwardRef } from "react"
import { TouchableOpacity, Text, StyleSheet } from "react-native"

interface ButtonProps {
  title: string
  onPress: () => void
  disabled?: boolean
  style?: any
  hasTVPreferredFocus?: boolean
}

const Button = forwardRef<TouchableOpacity, ButtonProps>(
  ({ title, onPress, disabled = false, style, hasTVPreferredFocus = false }, ref) => {
    return (
      <TouchableOpacity
        ref={ref}
        style={[styles.button, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled}
        hasTVPreferredFocus={hasTVPreferredFocus}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, disabled && styles.disabledText]}>{title}</Text>
      </TouchableOpacity>
    )
  },
)

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    backgroundColor: "#666666",
  },
  text: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
  disabledText: {
    color: "#cccccc",
  },
})

export default Button
