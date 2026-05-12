"use client";

import { usePathname } from "next/navigation";
import { useRef, useState, useCallback, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import Script from "next/script";
import { NavBar } from "@/components/NavBar";
import { AppSidebar } from "@/components/AppSidebar";

const VIDEO_ID = "amfWIRasxtI";

interface YTPlayer {
  playVideo(): void;
  mute(): void;
  unMute(): void;
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/" && !pathname?.startsWith("/auth");
  const playerRef = useRef<YTPlayer | null>(null);
  const [muted, setMuted] = useState(true);

  const initPlayer = useCallback(() => {
    // @ts-ignore
    if (playerRef.current || !window.YT?.Player) return;
    const wasUnmuted = localStorage.getItem("hf_music_muted") === "false";
    // @ts-ignore
    playerRef.current = new window.YT.Player("yt-bg-music", {
      videoId: VIDEO_ID,
      playerVars: { autoplay: 1, mute: 1, loop: 1, playlist: VIDEO_ID, controls: 0, rel: 0, playsinline: 1 },
      events: {
        onReady: (e: { target: YTPlayer }) => {
          e.target.playVideo();
          if (wasUnmuted) {
            e.target.unMute();
            setMuted(false);
          }
        },
      },
    });
  }, []);

  const handleScriptLoad = useCallback(() => {
    // @ts-ignore
    if (window.YT?.Player) {
      initPlayer();
    } else {
      // @ts-ignore
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [initPlayer]);

  // Resume after OAuth popup or tab switch
  useEffect(() => {
    const resume = () => playerRef.current?.playVideo();
    const onVis = () => { if (document.visibilityState === "visible") resume(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", resume);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", resume);
    };
  }, []);

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      p.playVideo();
      setMuted(false);
      localStorage.setItem("hf_music_muted", "false");
    } else {
      p.mute();
      setMuted(true);
      localStorage.setItem("hf_music_muted", "true");
    }
  };

  const muteToggle = (
    <button
      onClick={toggleMute}
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors w-full"
      aria-label={muted ? "Unmute music" : "Mute music"}
    >
      {muted
        ? <VolumeX className="h-3.5 w-3.5 shrink-0" />
        : <Volume2 className="h-3.5 w-3.5 shrink-0" />}
      <span className="text-xs">{muted ? "Music off" : "Music on"}</span>
    </button>
  );

  return (
    <>
      <Script
        src="https://www.youtube.com/iframe_api"
        strategy="afterInteractive"
        onReady={handleScriptLoad}
      />

      {/* Invisible 1×1 YouTube player — parent div preserves position after YT replaces inner div */}
      <div style={{ position: "fixed", bottom: 0, right: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div id="yt-bg-music" style={{ width: 1, height: 1 }} />
      </div>

      {showSidebar ? (
        <AppSidebar muteToggle={muteToggle} />
      ) : (
        <>
          <NavBar />
          <div className="fixed bottom-6 right-6 z-50">
            <div className="flex items-center rounded-full px-1 py-1 bg-[var(--bg-surface)]/80 backdrop-blur-sm border border-[var(--border)] shadow-lg">
              {muteToggle}
            </div>
          </div>
        </>
      )}

      <div className={showSidebar ? "pl-[3.25rem]" : ""}>
        {children}
      </div>
    </>
  );
}
