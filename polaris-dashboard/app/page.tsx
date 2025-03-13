import USDrillDownMap from "@/components/USDrillDownMap";

export default function Home() {
    return (
        <section className="flex flex-col items-center justify-center gap-4">
            <div className="inline-block max-w-xl text-center justify-center justify-items-center">
                <h1 className="text-3xl font-bold mb-6 text-center">US Map with State Boundaries</h1>
                {/* <USMap /> */}
                <USDrillDownMap />
            </div>
        </section>
    );
}
