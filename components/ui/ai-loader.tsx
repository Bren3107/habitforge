"use client";

const text = "cooking your personalized plan..";

export function AiLoader() {
  const words = text.split(" ");
  let charIndex = 0;

  return (
    <div className="loader-orb">
      <div className="loader-sphere" />
      <div className="loader-orb-text">
        {words.map((word, wi) => {
          const wordStart = charIndex;
          charIndex += word.length + (wi < words.length - 1 ? 1 : 0);
          return (
            <span key={wi} className="loader-word">
              {word.split("").map((char, ci) => (
                <span
                  key={ci}
                  className="loader-letter"
                  style={{ animationDelay: `${(wordStart + ci) * 0.08}s` }}
                >
                  {char}
                </span>
              ))}
              {wi < words.length - 1 && (
                <span className="loader-letter" style={{ animationDelay: `${(wordStart + word.length) * 0.08}s` }}>
                  {" "}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
