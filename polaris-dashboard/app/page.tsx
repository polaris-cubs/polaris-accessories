import USMap from "@/components/USMap";

export default function Home() {
    return (
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <div className="inline-block max-w-xl text-center justify-center">
                <h1 className="text-3xl font-bold mb-6 text-center">US Map with State Boundaries</h1>
                <USMap />
            </div>
        </section>
    );
}
