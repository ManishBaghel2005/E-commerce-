import BASE_URL from "./config.js";

/**
 * 1. Reusable template helper for dynamic variant markup rows.
 */
function getVariantRowHTML(isFirstRow = false) {
    return `
        <div>
            ${isFirstRow ? `<label class="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Volume</label>` : ''}
            <select class="v-volume w-full px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-xs focus:outline-none focus:border-amber-700">
                 <option value="50g">50g</option>
                 <option value="100g">100g</option>
                 <option value="30ml">30ml</option>
                 <option value="100ml">100ml</option>
                 <option value="200ml" selected>200ml</option>
                 <option value="500ml">500ml</option>
            </select>
        </div>
        <div>
            ${isFirstRow ? `<label class="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Offer Price (₹)</label>` : ''}
            <input type="number" min="0" placeholder="e.g. 500" class="v-price w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-amber-700" required>
        </div>
        <div>
            ${isFirstRow ? `<label class="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">MRP Price (₹)</label>` : ''}
            <input type="number" min="0" placeholder="e.g. 700" class="v-comparePrice w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-amber-700">
        </div>
        <div class="flex items-center gap-2">
            <div class="w-full">
                ${isFirstRow ? `<label class="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Stock</label>` : ''}
                <input type="number" min="0" value="10" class="v-stock w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-amber-700" required>
            </div>
            <button type="button" onclick="removeVariantRow(this)" class="text-red-400 hover:text-red-600 p-1 transition ${isFirstRow ? 'mt-5 opacity-0 pointer-events-none' : 'mt-1.5'}">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `;
}

/**
 * 2. Injects a clean variant layout template into the container.
 */
function addVariantRow() {
    const container = document.getElementById("variantsContainer");
    const newRow = document.createElement("div");
    
    newRow.className = "variant-row grid grid-cols-4 gap-3 items-end bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative animate__animated animate__fadeInUp animate__faster";
    newRow.innerHTML = getVariantRowHTML(false);
    
    container.appendChild(newRow);
}

/**
 * 3. Removes the target variation element block.
 */
function removeVariantRow(button) {
    const row = button.closest('.variant-row');
    if (row) {
        row.remove();
    }
}

// Expose handlers globally
window.addVariantRow = addVariantRow;
window.removeVariantRow = removeVariantRow;

/**
 * 4. Intercepts submission lifecycle and handles network safely.
 */
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const formElement = e.target;
    const submitButton = formElement.querySelector('button[type="submit"]');

    // FIX: Click freeze taaki double request se Multer crash aur Request Aborted na ho
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Saving Product...";
    }

    const formData = new FormData(formElement);
    const variantRows = document.querySelectorAll('.variant-row');
    const variantsArray = [];

    variantRows.forEach(row => {
        const volume = row.querySelector('.v-volume').value;
        const price = row.querySelector('.v-price').value;
        const comparePrice = row.querySelector('.v-comparePrice').value;
        const stock = row.querySelector('.v-stock').value;

        if (volume && price) {
            variantsArray.push({
                volume: volume,
                price: Number(price),
                comparePrice: comparePrice ? Number(comparePrice) : undefined,
                stock: stock ? Number(stock) : 10
            });
        }
    });

    formData.append('variants', JSON.stringify(variantsArray));

    try {
        const response = await fetch(`${BASE_URL}/api/product/add`, {
            method: 'POST',
            body: formData 
        });

        const data = await response.json();

        if (response.ok) {
            alert('Product successfully added!');
            formElement.reset();
            
            // Variants container ko wapas empty karke ek single row set karna
            const container = document.getElementById("variantsContainer");
            container.innerHTML = "";
            
            const initialRow = document.createElement("div");
            initialRow.className = "variant-row grid grid-cols-4 gap-3 items-end bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative";
            initialRow.innerHTML = getVariantRowHTML(true);
            container.appendChild(initialRow);

            // 💡 TIP: Agar aapke paas page par table render karne ka function hai (e.g., loadProducts()), 
            // toh use yahan call karein taaki data hilne ke bajaye seedhe update ho jaye.
            if (typeof window.loadProducts === 'function') {
                window.loadProducts();
            } else if (typeof loadProducts === 'function') {
                loadProducts();
            }

        } else {
            alert('Error: ' + (data.error || 'Product add nahi ho paya'));
        }
    } catch (err) {
        console.error('Submission processing failure:', err);
        alert('Server se connect nahi ho paya!');
    } finally {
        // Button ko wapas normal state me laayein
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = "Add New Product";
        }
    }
});