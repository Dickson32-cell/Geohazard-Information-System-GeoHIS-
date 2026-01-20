// scrollVideo.js

class ScrollVideo {
    constructor(videoElement, options = {}) {
        this.video = videoElement;
        this.options = {
            threshold: 0.05,
            smoothing: true,
            debug: false,
            ...options
        };
        this.isTracking = false;
        this.animationId = null;
        this.intersectionObserver = null;
        this.progress = 0;

        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.video.addEventListener('loadedmetadata', () => {
            document.querySelector('.video-loading').style.display = 'none';
        });
        this.video.addEventListener('canplay', () => {
            // Video is ready
        });
    }

    calculateScrollProgress() {
        // Calculate progress based on scroll position relative to scroll-spacer
        const spacer = document.querySelector('.scroll-spacer');
        const rect = spacer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const totalHeight = rect.height;
        const scrolled = windowHeight - rect.top;
        this.progress = Math.max(0, Math.min(1, scrolled / totalHeight));
        return this.progress;
    }

    updateVideoTime(targetProgress) {
        if (!this.video.duration) return;
        const targetTime = targetProgress * this.video.duration;
        if (Math.abs(this.video.currentTime - targetTime) > this.options.threshold) {
            this.video.currentTime = targetTime;
        }
    }

    startScrollTracking() {
        if (this.isTracking) return;
        this.isTracking = true;
        this.trackScroll();
    }

    stopScrollTracking() {
        this.isTracking = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    trackScroll() {
        if (!this.isTracking) return;
        const progress = this.calculateScrollProgress();
        this.updateVideoTime(progress);
        this.updateProgressBar(progress);
        this.animationId = requestAnimationFrame(() => this.trackScroll());
    }

    updateProgressBar(progress) {
        const fill = document.querySelector('.scroll-progress-bar-fill');
        fill.style.width = `${progress * 100}%`;
    }

    setupIntersectionObserver() {
        const wrapper = document.querySelector('.video-wrapper');
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.startScrollTracking();
                } else {
                    this.stopScrollTracking();
                }
            });
        });
        this.intersectionObserver.observe(wrapper);
    }

    destroy() {
        this.stopScrollTracking();
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('portfolioVideo');
    const scrollVideo = new ScrollVideo(video, { debug: false });
});