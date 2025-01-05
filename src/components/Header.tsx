import { GraduationCap } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full bg-white border-b border-gray-200 px-4 py-3 mb-6">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <GraduationCap className="h-8 w-8 text-[#9b87f5]" />
        <h1 className="text-xl font-semibold text-[#1A1F2C]">Chess Sage Analyzer</h1>
      </div>
    </header>
  );
};

export default Header;