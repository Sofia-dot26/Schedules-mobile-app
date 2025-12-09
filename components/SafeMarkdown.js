// components/SafeMarkdown.js
import React from 'react';
import MarkdownDisplay from 'react-native-markdown-display';

const SafeMarkdown = React.forwardRef((props, ref) => {
  const { children, ...restProps } = props;
  
  // Убираем key из restProps, если он там есть
  const { key, ...safeProps } = restProps;
  
  return (
    <MarkdownDisplay
      {...safeProps}
      ref={ref}
    >
      {children}
    </MarkdownDisplay>
  );
});

SafeMarkdown.displayName = 'SafeMarkdown';

export default SafeMarkdown;