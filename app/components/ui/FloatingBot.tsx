// components/ui/FloatingBot.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const FloatingBot = () => {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5, ease: [0.6, 0.05, 0.01, 0.9] }}
      className="fixed bottom-8 right-8 z-50"
    >
      {/* Bot Icon */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-2xl"
        >
          🤖
        </motion.span>
      </motion.div>

      {/* Chatbot Interface */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.6, 0.05, 0.01, 0.9] }}
            className="absolute bottom-20 right-0 w-80 bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-blue-500 text-white p-4">
              <h2 className="text-lg font-medium">Chatbot</h2>
              <p className="text-sm">How can I help you today?</p>
            </div>

            {/* Chat Messages */}
            <div className="p-4 h-60 overflow-y-auto">
              <div className="mb-4">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm">Hello! How can I assist you?</p>
                </div>
              </div>
              <div className="mb-4 text-right">
                <div className="bg-blue-500 text-white p-3 rounded-lg inline-block">
                  <p className="text-sm">Hi! I need some help.</p>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FloatingBot;