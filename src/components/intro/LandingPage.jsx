import Image from "next/image";
import strydeImage from "@/assets/images/stryde-logo .png";

export default function LandingPage({getStarted}) {
  return (
    <main className="min-h-screen bg-bento-bg text-bento-text flex items-center justify-center px-6">
      <section className="flex flex-1 flex-col items-center text-center max-w-2xl">


        <div className="flex flex-col gap-3">
            <p className="text-sm sm:text-base font-semibold text-bento-muted">
              Welcome to Stryde
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-bento-text">
              Build streaks. Not excuses
            </h1>
        </div>

                  <div className="flex flex-1 items-center justify-center w-full py-8 sm:py-10">
                    <Image
                      src={strydeImage}
                      alt="Stryde"
                      priority
                      className="w-full max-w-[280px] sm:max-w-[380px] lg:max-w-[460px] h-auto object-contain"
                    />
                  </div>

        <form action={getStarted} className="w-full">
          <button
            type="submit"
            className="w-full rounded-xl bg-stryde-primary px-5 py-4 text-sm font-semibold text-white"
          >
            Get Started
          </button>
        </form>
      </section>
    </main>
  );
}