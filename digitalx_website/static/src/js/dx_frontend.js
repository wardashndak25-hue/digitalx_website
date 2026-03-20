/** @odoo-module **/

function patchBootstrapCarousel() {
    const Carousel = window.bootstrap && window.bootstrap.Carousel;
    if (!Carousel || Carousel.prototype._dxIndicatorGuardPatched) {
        return;
    }
    Carousel.prototype._dxIndicatorGuardPatched = true;
    Carousel.prototype._setActiveIndicatorElement = function (activeElement) {
        if (!this._indicatorsElement) {
            return;
        }
        const activeIndicator = this._indicatorsElement.querySelector(".active");
        if (activeIndicator) {
            activeIndicator.classList.remove("active");
            activeIndicator.removeAttribute("aria-current");
        }
        const nextIndicator = this._indicatorsElement.children[this._getItemIndex(activeElement)];
        if (!nextIndicator) {
            return;
        }
        nextIndicator.classList.add("active");
        nextIndicator.setAttribute("aria-current", "true");
    };
}

function disableBrokenAutoplayCarousels(root = document) {
    root.querySelectorAll(".carousel").forEach((carouselEl) => {
        const items = carouselEl.querySelectorAll(".carousel-item");
        if (items.length < 2) {
            return;
        }
        const indicators = carouselEl.querySelectorAll(".carousel-indicators > *");
        if (indicators.length === items.length) {
            return;
        }
        carouselEl.removeAttribute("data-bs-ride");
        carouselEl.setAttribute("data-bs-interval", "false");
        const carousel = window.bootstrap && window.bootstrap.Carousel && window.bootstrap.Carousel.getInstance(carouselEl);
        if (carousel && typeof carousel.pause === "function") {
            carousel.pause();
        }
    });
}

function startHeroSlider(slider) {
    if (!slider || slider.dataset.dxHeroReady === "1") {
        return;
    }
    slider.dataset.dxHeroReady = "1";
    const slides = [...slider.querySelectorAll(".cc-hero-slide")];
    const dots = [...slider.querySelectorAll("[data-dx-hero-dot]")];
    if (slides.length < 2 || dots.length !== slides.length) {
        return;
    }
    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
    if (activeIndex < 0) {
        activeIndex = 0;
        slides[0].classList.add("is-active");
    }
    dots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === activeIndex);
    });
    const restartTimer = () => window.setInterval(() => {
        setActive((activeIndex + 1) % slides.length);
    }, 5000);
    const setActive = (nextIndex) => {
        if (nextIndex === activeIndex || !slides[nextIndex] || !dots[nextIndex]) {
            return;
        }
        slides[activeIndex] && slides[activeIndex].classList.remove("is-active");
        dots[activeIndex] && dots[activeIndex].classList.remove("is-active");
        activeIndex = nextIndex;
        slides[activeIndex].classList.add("is-active");
        dots[activeIndex].classList.add("is-active");
    };
    let timerId = restartTimer();
    slider.addEventListener("mouseenter", () => {
        window.clearInterval(timerId);
    });
    slider.addEventListener("mouseleave", () => {
        window.clearInterval(timerId);
        timerId = restartTimer();
    });
    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            window.clearInterval(timerId);
            setActive(index);
            timerId = restartTimer();
        });
    });
}

function bootDxFrontend() {
    patchBootstrapCarousel();
    disableBrokenAutoplayCarousels(document);
    document.querySelectorAll("[data-dx-hero-slider]").forEach((slider) => {
        startHeroSlider(slider);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootDxFrontend, { once: true });
} else {
    bootDxFrontend();
}
