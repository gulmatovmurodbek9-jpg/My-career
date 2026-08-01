import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

export function FloatingChatButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-2xl icon-box-solid flex items-center justify-center z-50 cursor-pointer"
      aria-label="Open chat"
    >
      <MessageSquare className="w-5 h-5 text-white" />
    </motion.button>
  );
}
