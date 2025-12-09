// screens/DocumentationScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Image
} from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Markdown from 'react-native-markdown-display';

// Конфигурация
const GITHUB_PAGES_URL = 'https://sofia-dot26.github.io/attendance-docs/';
const RAW_BASE_URL = 'https://raw.githubusercontent.com/Sofia-dot26/attendance-docs/main/';

const DocumentationScreen = ({ navigation, route }) => {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [history, setHistory] = useState([]);

  // Загрузка документации - УПРОЩЕННАЯ ВЕРСИЯ
  const loadDocumentation = useCallback(async (path = '', isRefresh = false) => {
    try {
      console.log('🚀 Загрузка документации:', path || 'main');
      
      // Просто устанавливаем состояния без сложных проверок
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // Определяем URL для загрузки
      let rawUrl;
      let normalizedPath = path || '';

      if (!normalizedPath || normalizedPath === 'main') {
        rawUrl = `${RAW_BASE_URL}README.md`;
      } else if (normalizedPath.includes('#')) {
        // Убираем якорь из пути
        normalizedPath = normalizedPath.split('#')[0];
        rawUrl = `${RAW_BASE_URL}${normalizedPath}`;
      } else {
        rawUrl = `${RAW_BASE_URL}${normalizedPath}`;
        
        // Если это директория, добавляем README.md
        if (!normalizedPath.endsWith('.md')) {
          rawUrl = `${rawUrl}/README.md`;
        }
      }

      console.log('🔗 URL для загрузки:', rawUrl);

      const response = await fetch(rawUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const processedText = processMarkdownLinks(text, normalizedPath);
      
      // Обновляем состояния
      setMarkdown(processedText);
      setCurrentPath(normalizedPath);

      if (!history.includes(normalizedPath)) {
        setHistory(prev => [...prev, normalizedPath]);
      }

      console.log('✅ Успешно загружено:', normalizedPath);

    } catch (err) {
      console.error('❌ Ошибка загрузки:', err.message);
      // Только устанавливаем ошибку, НЕ переходим автоматически на главную
      setError(`Не удалось загрузить: ${err.message}`);
    } finally {
      // Гарантированно сбрасываем состояния загрузки
      setLoading(false);
      setRefreshing(false);
    }
  }, [history]);

  // Обработка ссылок в markdown
  const processMarkdownLinks = (text, basePath) => {
    // Заменяем относительные пути изображений
    const withImages = text.replace(
      /!\[(.*?)\]\((?!http)(.*?)\)/g,
      (match, altText, imagePath) => {
        let absolutePath;
        
        if (imagePath.startsWith('./')) {
          const parentDir = basePath.split('/').slice(0, -1).join('/');
          absolutePath = `${parentDir}/${imagePath.slice(2)}`;
        } else if (imagePath.startsWith('../')) {
          // Для относительных путей вверх
          const parts = basePath.split('/').filter(Boolean);
          const upCount = (imagePath.match(/\.\.\//g) || []).length;
          const newParts = parts.slice(0, -upCount);
          const newPath = imagePath.replace(/\.\.\//g, '');
          absolutePath = `${newParts.join('/')}/${newPath}`;
        } else {
          absolutePath = imagePath;
        }
        
        return `![${altText}](${RAW_BASE_URL}${absolutePath})`;
      }
    );

    return withImages;
  };

  // Инициализация - УПРОЩЕННАЯ
  useEffect(() => {
    const initialPath = route.params?.section || '';
    console.log('🔍 Инициализация с путем:', initialPath || 'main');
    loadDocumentation(initialPath);
  }, [route.params?.section]);

  // Обработчик кликов по ссылкам - УПРОЩЕННЫЙ
  const handleLinkPress = useCallback((url) => {
    console.log('🔗 Нажата ссылка:', url);

    // Обрабатываем разные типы ссылок
    if (url.startsWith('#')) {
      // Якорные ссылки - игнорируем
      return true;
    }

    if (url.startsWith('./') || url.startsWith('../')) {
      // Относительные ссылки внутри документации
      const newPath = resolveRelativePath(currentPath, url);
      console.log('📂 Загружаем относительный путь:', newPath);
      loadDocumentation(newPath);
      return true;
    }

    if (url.includes('github.io') || url.includes('attendance-docs')) {
      // Ссылки на нашу документацию
      const path = extractDocPath(url);
      console.log('📚 Загружаем путь документации:', path);
      loadDocumentation(path);
      return true;
    }

    if (url.startsWith('http')) {
      // Внешние ссылки
      Linking.openURL(url).catch(err => {
        console.error('Не удалось открыть URL:', err);
        Alert.alert('Ошибка', 'Не удалось открыть ссылку');
      });
      return false;
    }

    return false;
  }, [currentPath, loadDocumentation]);

  // Вспомогательные функции
  const resolveRelativePath = (base, relative) => {
    if (relative.startsWith('./')) {
      const baseDir = base.includes('/') 
        ? base.substring(0, base.lastIndexOf('/') + 1)
        : '';
      return `${baseDir}${relative.slice(2)}`;
    } else if (relative.startsWith('../')) {
      const upCount = (relative.match(/\.\.\//g) || []).length;
      const parts = base.split('/').filter(Boolean);
      const newParts = parts.slice(0, -upCount);
      const newPath = relative.replace(/\.\.\//g, '');
      return `${newParts.join('/')}/${newPath}`;
    }
    return relative;
  };

  const extractDocPath = (url) => {
    if (url.includes('github.io')) {
      return url.replace(GITHUB_PAGES_URL, '');
    } else if (url.includes('raw.githubusercontent.com')) {
      return url.replace(RAW_BASE_URL, '').replace('/README.md', '');
    }
    return url;
  };

  const getPageTitle = () => {
    const titles = {
      '': 'Документация',
      'guide/getting-started': 'Начало работы',
      'guide/schedule': 'Расписание',
      'features/attendance': 'Посещаемость',
      'features/reports': 'Отчеты',
      'faq': 'Частые вопросы',
      'guide': 'Руководство'
    };
    
    return titles[currentPath] || 'Документация';
  };

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previousPath = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      loadDocumentation(previousPath);
    } else {
      navigation.goBack();
    }
  };

  const handleHome = () => {
    loadDocumentation('');
  };

  const onRefresh = () => {
    loadDocumentation(currentPath, true);
  };

  // Рендер состояния загрузки
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
          <Text style={styles.title}>Загрузка...</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0056b3" />
          <Text style={styles.loadingText}>Загрузка документации...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Рендер ошибки
  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
          <Text style={styles.title}>Ошибка</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="error-outline" size={64} color="#dc3545" />
          <Text style={styles.errorTitle}>Ошибка загрузки</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => loadDocumentation(currentPath)}
          >
            <Text style={styles.buttonText}>Повторить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={handleHome}
          >
            <Text style={[styles.buttonText, styles.outlineButtonText]}>На главную</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Основной рендер
  return (
    <SafeAreaView style={styles.container}>
      {/* Кастомный хедер */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1a365d" />
        </TouchableOpacity>
        
        <Text style={styles.title} numberOfLines={1}>
          {getPageTitle()}
        </Text>
        
        <TouchableOpacity onPress={handleHome} style={styles.homeButton}>
          <Icon name="home" size={24} color="#1a365d" />
        </TouchableOpacity>
      </View>

      {/* Контент документации */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0056b3']}
          />
        }
      >
        <View style={styles.content}>
          <Markdown
            style={markdownStyles}
            onLinkPress={handleLinkPress}
            mergeStyle={true}
            rules={{
              image: (node, children, parent, styles) => {
                const { src, alt } = node.attributes;
                return (
                  <Image
                    key={src}
                    source={{ uri: src }}
                    style={markdownStyles.image}
                    resizeMode="contain"
                    accessible={true}
                    accessibilityLabel={alt || 'Изображение документации'}
                  />
                );
              }
            }}
          >
            {markdown}
          </Markdown>
        </View>
        
        {/* Кнопка для открытия в браузере */}
        <TouchableOpacity
          style={styles.browserButton}
          onPress={() => Linking.openURL(GITHUB_PAGES_URL)}
        >
          <Icon name="open-in-browser" size={20} color="#0056b3" />
          <Text style={styles.browserButtonText}>Открыть в браузере</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Стили для markdown
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontFamily: 'System',
  },
  heading1: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#1a365d',
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 8,
    color: '#1a365d',
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
    color: '#1a365d',
  },
  paragraph: {
    marginVertical: 8,
  },
  link: {
    color: '#0056b3',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#f8f9fa',
    borderLeftColor: '#0056b3',
    borderLeftWidth: 4,
    paddingLeft: 16,
    paddingVertical: 8,
    marginVertical: 12,
    borderRadius: 4,
  },
  code_inline: {
    backgroundColor: '#f1f3f5',
    fontFamily: 'monospace',
    fontSize: 14,
    paddingHorizontal: 4,
    borderRadius: 3,
    color: '#495057',
  },
  code_block: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginVertical: 12,
    fontFamily: 'monospace',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  list_item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  bullet_list_icon: {
    marginRight: 8,
    marginTop: 6,
  },
  image: {
    width: '100%',
    height: 200,
    marginVertical: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
});

// Основные стили
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    paddingTop: 60
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a365d',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 36,
  },
  homeButton: {
    padding: 8,
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#0056b3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 6,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0056b3',
  },
  outlineButtonText: {
    color: '#0056b3',
  },
  browserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cce0ff',
  },
  browserButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#0056b3',
    fontWeight: '500',
  },
});

export default DocumentationScreen;