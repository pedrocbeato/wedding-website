(() => {
    try {
        window.localStorage.clear();
    } catch (error) {
        console.warn('Unable to clear localStorage:', error);
    }
})();
