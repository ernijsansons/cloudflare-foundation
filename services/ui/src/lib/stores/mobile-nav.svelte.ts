/**
 * Mobile Navigation Store
 *
 * Manages mobile sidebar open/closed state and provides helpers for responsive navigation.
 */

function createMobileNavStore() {
	let isOpen = $state(false);
	let isMobile = $state(false);

	// Check if we're on mobile on mount (client-side only)
	if (typeof window !== "undefined") {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
			// Auto-close sidebar when switching to desktop
			if (!isMobile && isOpen) {
				isOpen = false;
			}
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
	}

	return {
		get isOpen() {
			return isOpen;
		},
		get isMobile() {
			return isMobile;
		},

		open() {
			isOpen = true;
			// Prevent body scroll when sidebar is open on mobile
			if (typeof document !== "undefined") {
				document.body.style.overflow = "hidden";
			}
		},

		close() {
			isOpen = false;
			// Restore body scroll
			if (typeof document !== "undefined") {
				document.body.style.overflow = "";
			}
		},

		toggle() {
			if (isOpen) {
				this.close();
			} else {
				this.open();
			}
		},
	};
}

export const mobileNavStore = createMobileNavStore();
