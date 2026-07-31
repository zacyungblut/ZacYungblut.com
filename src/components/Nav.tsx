import { Wordmark } from "./Wordmark";

export function Nav() {
  return (
    <header className="flex justify-center pt-10">
      <a href="#">
        <Wordmark className="h-auto w-72 sm:w-80" />
      </a>
    </header>
  );
}
