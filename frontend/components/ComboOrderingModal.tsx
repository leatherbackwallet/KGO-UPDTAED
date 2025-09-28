import React, { useState, useEffect } from 'react';
import { Product, ComboItem } from '../types/shared';
import { getMultilingualText } from '../utils/api';
import { 
  calculateComboPrice, 
  createComboItemConfigurations, 
  formatComboPriceBreakdown,
  formatPrice,
  ComboItemConfiguration 
} from '../utils/comboUtils';

interface ComboOrderingModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (comboConfig: {
    productId: string;
    quantity: number;
    price: number;
    isCombo: boolean;
    comboBasePrice: number;
    comboItemConfigurations: ComboItemConfiguration[];
  }) => void;
}

const ComboOrderingModal: React.FC<ComboOrderingModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [comboItemConfigurations, setComboItemConfigurations] = useState<ComboItemConfiguration[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  // Initialize combo item configurations when product changes
  useEffect(() => {
    if (product.isCombo && product.comboItems) {
      const initialConfigs = createComboItemConfigurations(product.comboItems);
      setComboItemConfigurations(initialConfigs);
    }
  }, [product]);

  // Calculate total price when configurations or quantity change
  useEffect(() => {
    if (product.isCombo && product.comboBasePrice) {
      const comboPrice = calculateComboPrice(product.comboBasePrice, comboItemConfigurations);
      setTotalPrice(comboPrice * quantity);
    } else {
      setTotalPrice((product.price || 0) * quantity);
    }
  }, [comboItemConfigurations, quantity, product]);

  const handleQuantityChange = (itemName: string, newQuantity: number) => {
    setComboItemConfigurations(prev => 
      prev.map(item => 
        item.name === itemName 
          ? { ...item, quantity: Math.max(0, newQuantity) }
          : item
      )
    );
  };

  const handleAddToCart = () => {
    if (product.isCombo) {
      onAddToCart({
        productId: product._id,
        quantity,
        price: totalPrice,
        isCombo: true,
        comboBasePrice: product.comboBasePrice || 0,
        comboItemConfigurations
      });
    } else {
      onAddToCart({
        productId: product._id,
        quantity,
        price: totalPrice,
        isCombo: false,
        comboBasePrice: 0,
        comboItemConfigurations: []
      });
    }
    onClose();
  };

  const priceBreakdown = product.isCombo && product.comboBasePrice 
    ? formatComboPriceBreakdown(product.comboBasePrice, comboItemConfigurations)
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {getMultilingualText(product.name)}
              </h2>
              {product.isCombo && (
                <p className="text-sm text-gray-600 mt-1">
                  Customize your combo by adjusting quantities below
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Product Description */}
          <div className="mb-6">
            <p className="text-gray-700">
              {getMultilingualText(product.description)}
            </p>
          </div>

          {/* Combo Items Configuration */}
          {product.isCombo && product.comboItems && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Combo Items
              </h3>
              <div className="space-y-4">
                {comboItemConfigurations.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.unitPrice)} per {item.unit}
                        </p>
                        {(item.defaultQuantity || 0) > 0 && (
                          <p className="text-xs text-gray-500">
                            Default: {item.defaultQuantity || 0} {item.unit}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(item.quantity * item.unitPrice)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(item.name, item.quantity - 0.5)}
                        disabled={item.quantity <= 0}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.name, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleQuantityChange(item.name, item.quantity + 0.5)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        +
                      </button>
                      <span className="text-sm text-gray-600 ml-2">
                        {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          {priceBreakdown && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Price Breakdown
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Combo Price:</span>
                  <span className="font-medium">{formatPrice(priceBreakdown.basePrice)}</span>
                </div>
                {priceBreakdown.additionalItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      +{item.additionalQuantity} {item.unit} {item.name}:
                    </span>
                    <span className="font-medium">{formatPrice(item.additionalCost)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total per combo:</span>
                    <span>{formatPrice(priceBreakdown.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quantity Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-2 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Total Price */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total Price:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={(product.stock || 0) === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Add to Cart - {formatPrice(totalPrice)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboOrderingModal;
