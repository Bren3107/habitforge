"use client";

import styles from "./ai-loader.module.css";

const text = "cooking your personalized plan..";

export function AiLoader() {
  const words = text.split(" ");
  let charIndex = 0;

  return (
    <div className={styles.orb}>
      <div className={styles.sphere} />
      <div className={styles.text}>
        {words.map((word, wi) => {
          const wordStart = charIndex;
          charIndex += word.length + (wi < words.length - 1 ? 1 : 0);
          return (
            <span key={wi} className={styles.word}>
              {word.split("").map((char, ci) => (
                <span
                  key={ci}
                  className={styles.letter}
                  style={{ animationDelay: `${(wordStart + ci) * 0.08}s` }}
                >
                  {char}
                </span>
              ))}
              {wi < words.length - 1 && (
                <span
                  className={styles.letter}
                  style={{ animationDelay: `${(wordStart + word.length) * 0.08}s` }}
                >
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
