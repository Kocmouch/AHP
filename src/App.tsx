import "./index.css";
import { AHPCalculator } from "@/components/ahp/AHPCalculator";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ahp-theme">
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 w-full">
        <header className="fixed top-0 right-0 p-4 z-50">
          <ThemeToggle />
        </header>
        <AHPCalculator />
      </div>
    </ThemeProvider>
  );
}

export default App;

