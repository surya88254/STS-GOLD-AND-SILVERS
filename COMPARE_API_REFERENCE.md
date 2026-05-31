# 🔧 Developer API Reference - Product Comparison

## CompareContext API

### Import & Setup

```javascript
import { useCompare } from "../context/CompareContext";
import { CompareProvider } from "../context/CompareContext";

// Wrap your component tree with CompareProvider
// (Already done in App.jsx)
```

### Hook: `useCompare()`

```javascript
const {
  compareList,       // array of product objects
  addToCompare,      // function: (product) => void
  removeFromCompare, // function: (productId) => void
  clearCompare,      // function: () => void
  isInCompare        // function: (productId) => boolean
} = useCompare();
```

### Methods

#### `addToCompare(product)`
Adds a product to the comparison list.
```javascript
const product = {
  id: "uuid",
  name: "Gold Ring",
  price: 15000,
  weight: "5g",
  metal_type: "Gold",
  making_charge: 500,
  wastage: 2.5,
  purity: "22K",
  category: "Rings",
  stock_qty: 10,
  image_url: "url/to/image.jpg",
  description: "Beautiful gold ring"
};

addToCompare(product);
```

**Constraints:**
- Max 2 products at a time
- No duplicates allowed
- Silently ignores if already exists or limit reached

---

#### `removeFromCompare(productId)`
Removes a product from the comparison list.
```javascript
removeFromCompare("product-id-123");
```

**Returns:** void
**Updates:** Local state + localStorage

---

#### `clearCompare()`
Removes all products from the comparison list.
```javascript
clearCompare();
```

**Use Case:** When user wants to start fresh

---

#### `isInCompare(productId)`
Checks if a product is in the comparison list.
```javascript
if (isInCompare(product.id)) {
  // Product is being compared
  console.log("Product is in compare list");
} else {
  // Product is not being compared
  console.log("Product not in compare list");
}
```

**Returns:** boolean (true/false)

---

### State: `compareList`

Array of product objects currently being compared.

```javascript
// Example compareList
[
  {
    id: "prod-1",
    name: "Gold Ring A",
    price: 15000,
    weight: "5g",
    // ... other fields
  },
  {
    id: "prod-2",
    name: "Gold Ring B",
    price: 18000,
    weight: "6g",
    // ... other fields
  }
]
```

**Properties:**
- `compareList.length` - Number of products (0, 1, or 2)
- `compareList[0]` - First product
- `compareList[1]` - Second product (if exists)

---

## localStorage Integration

### Key
```javascript
localStorage.getItem("sts_compare_list")
```

### Value Format
```javascript
// JSON array of products
[
  {
    id: "prod-1",
    name: "Ring",
    price: 15000,
    // ... all product fields
  }
]
```

### Auto-Management
- ✅ Automatically saved when compareList changes
- ✅ Automatically loaded on app start
- ✅ No manual management needed
- ✅ Survives page refresh
- ✅ Survives browser close

### Manual Override (if needed)
```javascript
// Clear localStorage
localStorage.removeItem("sts_compare_list");

// Set custom list
localStorage.setItem("sts_compare_list", JSON.stringify(customList));
```

---

## Usage Examples

### Example 1: Adding a Product
```javascript
import { useCompare } from "../context/CompareContext";

function MyComponent() {
  const { addToCompare } = useCompare();

  const handleCompare = () => {
    addToCompare({
      id: "1",
      name: "Gold Ring",
      price: 15000,
      weight: "5g",
      metal_type: "Gold",
      making_charge: 500,
      wastage: 2.5,
      purity: "22K",
      category: "Rings",
      stock_qty: 10,
      image_url: "url",
      description: "desc"
    });
  };

  return <button onClick={handleCompare}>Add to Compare</button>;
}
```

### Example 2: Showing Comparison Status
```javascript
import { useCompare } from "../context/CompareContext";

function ProductCard({ product }) {
  const { isInCompare, removeFromCompare, addToCompare } = useCompare();

  const inCompare = isInCompare(product.id);

  return (
    <button 
      onClick={() => {
        if (inCompare) {
          removeFromCompare(product.id);
        } else {
          addToCompare(product);
        }
      }}
    >
      {inCompare ? "✓ In Compare" : "Compare"}
    </button>
  );
}
```

### Example 3: Get Comparison Count
```javascript
import { useCompare } from "../context/CompareContext";

function CompareButton() {
  const { compareList } = useCompare();

  return (
    <div>
      Comparing ({compareList.length}/2 products)
      {compareList.length === 2 && <span>Max reached</span>}
    </div>
  );
}
```

### Example 4: Display All Compared Products
```javascript
import { useCompare } from "../context/CompareContext";

function CompareList() {
  const { compareList, removeFromCompare } = useCompare();

  return (
    <div>
      {compareList.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>₹{product.price}</p>
          <button onClick={() => removeFromCompare(product.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Comparison Table Structure

### Features Array (in Compare.jsx)
```javascript
const comparisonFeatures = [
  {
    label: "Feature Name",      // Display label
    key: "database_field",      // Field from product object
    type: "text|price|weight|image|number",  // Type for formatting
    highlight: "lower|higher"   // Optional: highlight best value
  }
]
```

### Adding New Features
```javascript
// In Compare.jsx, add to comparisonFeatures array:

{
  label: "Ring Size",
  key: "ring_size",
  type: "text"
}

{
  label: "Discount",
  key: "discount_percent",
  type: "number",
  highlight: "higher"  // Higher discount is better
}
```

---

## Styling Customization

### Compare Button (ProductCard.jsx)
Edit `/src/styles/ProductCard.css`:
```css
.compare-btn {
  /* Customize appearance */
  background: rgba(255, 215, 0, 0.12);
  color: #ffd760;
  /* etc */
}

.compare-btn:hover {
  /* Hover state */
}
```

### Compare Bar (CompareBar.jsx)
Edit `/src/styles/CompareBar.css`:
```css
.compare-bar-container {
  /* Customize position, animation */
}

.compare-bar-btn {
  /* Customize button */
}
```

### Compare Page
Edit `/src/styles/Compare.css`:
```css
.compare-table {
  /* Customize table */
}

.compare-value.highlight {
  /* Customize highlight color */
}
```

---

## Extending Features

### Add Email Share
```javascript
const handleShare = async () => {
  const products = compareList.map(p => p.name).join(" vs ");
  // Send email with comparison link
};
```

### Add Print Function
```javascript
const handlePrint = () => {
  window.print();
  // Print-friendly styles in @media print
};
```

### Add PDF Export
```javascript
import html2pdf from 'html2pdf.js';

const handlePDF = () => {
  const element = document.querySelector('.compare-table');
  html2pdf(element);
};
```

### Add Wishlist Integration
```javascript
const { addToWishlist } = useWishlist(); // your hook

compareList.forEach(product => {
  addToWishlist(product.id);
});
```

---

## Performance Notes

### Optimization Tips
1. ✅ Already using React Context (efficient)
2. ✅ Already using localStorage (no DB calls)
3. ✅ useEffect cleanup preventing memory leaks
4. ✅ Memoization could be added if needed

### If Needed - Add Memoization
```javascript
import { useMemo } from 'react';

const memoizedList = useMemo(() => compareList, [compareList]);
```

---

## Error Handling

### Existing Error Handling
- ✅ localStorage failures caught
- ✅ Invalid product data handled
- ✅ Max limit validation
- ✅ Duplicate prevention

### Custom Error Handling (if extending)
```javascript
try {
  addToCompare(product);
} catch (error) {
  console.error("Compare error:", error);
  // Handle error
}
```

---

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers
- ✅ localStorage supported in all modern browsers

---

## Debugging

### Check Current Compare List
```javascript
// In browser console
localStorage.getItem('sts_compare_list')
// Returns JSON array of products
```

### Clear Compare List
```javascript
// In browser console
localStorage.removeItem('sts_compare_list')
window.location.reload()
```

### Monitor Changes
```javascript
// Add to component for debugging
const { compareList } = useCompare();
useEffect(() => {
  console.log('Compare list updated:', compareList);
}, [compareList]);
```

---

## TypeScript Types (for future conversion)

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  weight: string;
  metal_type: string;
  making_charge: number;
  wastage: number;
  purity: string;
  category: string;
  stock_qty: number;
  image_url: string;
  description: string;
}

interface CompareContextType {
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}
```

---

## FAQ for Developers

**Q: Can I add more than 2 products?**
A: Change line ~27 in CompareContext.jsx: `if (prev.length >= 2)` → `if (prev.length >= 3)`

**Q: How do I change highlight logic?**
A: Edit `getHighlight()` function in Compare.jsx

**Q: Can I add custom fields to compare?**
A: Add to `comparisonFeatures` array in Compare.jsx

**Q: How do I style the highlight color?**
A: Edit `.compare-value.highlight` in Compare.css

**Q: Does it work offline?**
A: Yes, localStorage works offline

**Q: Is it SEO-friendly?**
A: Product details are server-rendered, comparison is client-side

---

## Summary

The comparison feature is designed for:
- ✅ Easy integration
- ✅ Extensibility
- ✅ Performance
- ✅ User experience
- ✅ Developer experience

All code is well-commented and follows React best practices.
