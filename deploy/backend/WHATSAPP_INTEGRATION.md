# WhatsApp Business Integration

## Overview
The WhatsApp Business integration provides customers with a direct way to chat with admin support via WhatsApp. A floating WhatsApp button appears on every page of the website, allowing customers to initiate conversations easily from anywhere on the site.

## Features

### WhatsAppButton Component
- **Location**: `frontend/src/components/WhatsAppButton.tsx`
- **Position**: Fixed bottom-right corner of the screen
- **Responsive**: Adapts to mobile and desktop screen sizes
- **Accessible**: Includes proper ARIA labels and keyboard navigation

### Key Features
1. **Global Floating Button**: Always visible on every page of the website
2. **Pre-filled Message**: Opens WhatsApp with a default message: "Hi, I'm interested in your products. Can you help me?"
3. **Customizable**: Phone number and message can be configured via environment variables
4. **Responsive Design**: Larger touch targets on mobile devices
5. **Hover Effects**: Smooth animations and tooltips
6. **Accessibility**: Keyboard navigation and screen reader support

## Configuration

### Environment Variables
Add the following to your `.env.local` file:

```bash
# WhatsApp Business Integration
NEXT_PUBLIC_WHATSAPP_NUMBER=+918075030919
```

### Customization Options
The WhatsAppButton component accepts the following props:

```typescript
interface WhatsAppButtonProps {
  phoneNumber?: string;  // WhatsApp business number
  message?: string;      // Pre-filled message
  className?: string;    // Additional CSS classes
}
```

## Usage

### Basic Usage
```tsx
import WhatsAppButton from '../components/WhatsAppButton';

// In your component
<WhatsAppButton />
```

### Custom Configuration
```tsx
<WhatsAppButton 
  phoneNumber="+918075030919"
  message="Hi, I need help with my order"
  className="custom-styles"
/>
```

## Implementation Details

### WhatsApp URL Format
The component generates WhatsApp URLs in the format:
```
https://wa.me/{phoneNumber}?text={encodedMessage}
```

### Phone Number Formatting
- Automatically removes non-digit characters (except +)
- Supports international format with country codes
- Example: `+91 98765 43210` becomes `+919876543210`

### Message Encoding
- Messages are automatically URL-encoded
- Supports special characters and emojis
- Maximum length handled by WhatsApp's API

## Styling

### Default Styling
- Green background (`bg-green-500`) matching WhatsApp brand
- Hover effects with scale animation
- Shadow effects for depth
- Responsive sizing (smaller on mobile, larger on desktop)

### Customization
The component uses Tailwind CSS classes and can be customized by:
1. Passing custom `className` prop
2. Modifying the component's default styles
3. Using CSS modules or styled-components

## Accessibility

### ARIA Support
- `role="button"` for screen readers
- `aria-label` for button description
- `title` attribute for tooltip
- Keyboard navigation support (Enter and Space keys)

### Mobile Optimization
- Larger touch targets on mobile devices
- Optimized positioning for thumb navigation
- Responsive icon sizing

## Browser Compatibility
- Works with all modern browsers
- Opens WhatsApp Web on desktop
- Opens WhatsApp app on mobile devices
- Graceful fallback for unsupported browsers

## Security Considerations
- Uses `noopener,noreferrer` for external links
- No sensitive data transmitted
- Phone number validation and sanitization
- URL encoding for message content

## Future Enhancements
Potential improvements for future versions:
1. Analytics tracking for button clicks
2. Custom message templates based on user context
3. Integration with customer support system
4. Multi-language support for messages
5. A/B testing for different message formats
