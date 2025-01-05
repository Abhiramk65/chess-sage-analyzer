import ChessAnalyzer from "@/components/ChessAnalyzer";
import Header from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#F1F0FB]">
      <Header />
      <main className="max-w-7xl mx-auto px-4">
        <ChessAnalyzer />
      </main>
    </div>
  );
};

export default Index;