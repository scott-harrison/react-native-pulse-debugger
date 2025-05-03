import Fireflies from '@/components/fireflies';
import Loader from '@/components/loader';

const WelcomeScreen = () => {
  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-purple-950 text-white">
      <Fireflies />

      <h1 className="text-5xl leading-loose font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-500 mb-2 animate-[fadeIn_1s_ease-in-out]">
        Pulse Debugger
      </h1>
      <p className="text-xl font-medium text-gray-300 mb-6 animate-[fadeIn_1.2s_ease-in-out]">
        Welcome to your debugging experience
      </p>
      <p className={`text-sm text-gray-400 font-medium mb-6 animate-[fadeIn_1.4s_ease-in-out]`}>
        Waiting for connection
      </p>
      <Loader />
    </div>
  );
};

export default WelcomeScreen;
