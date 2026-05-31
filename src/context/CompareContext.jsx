import { createContext, useContext, useState, useEffect } from "react";

const CompareContext = createContext({
  compareList: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  clearCompare: () => {},
  isInCompare: () => {},
});

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCompare = localStorage.getItem("sts_compare_list");
      if (savedCompare) {
        setCompareList(JSON.parse(savedCompare));
      }
    } catch (err) {
      console.error("Error loading compare list from localStorage:", err);
    }
  }, []);

  // Save to localStorage whenever compareList changes
  useEffect(() => {
    try {
      localStorage.setItem("sts_compare_list", JSON.stringify(compareList));
    } catch (err) {
      console.error("Error saving compare list to localStorage:", err);
    }
  }, [compareList]);

  const addToCompare = (product) => {
    setCompareList((prev) => {
      // Check if product already in compare list
      if (prev.some((p) => p.id === product.id)) {
        return prev;
      }

      // Max 2 products
      if (prev.length >= 2) {
        return prev;
      }

      return [...prev, product];
    });
  };

  const removeFromCompare = (productId) => {
    setCompareList((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const isInCompare = (productId) => {
    return compareList.some((p) => p.id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
