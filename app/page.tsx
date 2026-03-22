import { DialerWidget } from "@/components/dialer-widget"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Dialer Widget Demo
        </h1>
        <p className="text-muted-foreground">
          Click the phone icon in the bottom right corner to open the dialer widget.
        </p>
      </div>
      
      <DialerWidget />
    </main>
  )
}
