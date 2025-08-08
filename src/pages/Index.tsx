import { Helmet } from "react-helmet-async";
import { UploadPanel } from "@/components/UploadPanel";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>Data to Chart – Upload CSV/XLSX or Sheets</title>
        <meta name="description" content="Turn CSV, Excel, or Google Sheets into interactive charts with Chart.js." />
        <link rel="canonical" href={`${window.location.origin}/`} />
      </Helmet>
      <section className="container flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-6 text-center text-4xl font-bold sm:text-5xl">What can I help you visualize?</h1>
        <UploadPanel />
      </section>
    </main>
  );
};

export default Index;
