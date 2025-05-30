import React from "react";

interface AuthComponentProps {
  onSignIn: () => void;
}

const AuthComponent: React.FC<AuthComponentProps> = ({ onSignIn }) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="p-8 rounded-lg bg-gray-900 text-white">
        <h1 className="text-3xl mb-6 text-center">Peekaboo</h1>
        <div className="flex justify-center">
          <button 
            onClick={onSignIn}
            className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;