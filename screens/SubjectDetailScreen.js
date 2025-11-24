import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Platform,
  PermissionsAndroid
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import ScheduleService from '../services/ScheduleService';
import * as FileSystemLegacy from 'expo-file-system/legacy';

const SubjectDetailScreen = ({ route, navigation }) => {
  const { subjectId, subjectName } = route.params;
  const [subject, setSubject] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadSubjectData();
  }, [subjectId]);

  const loadSubjectData = async () => {
    try {
      setIsLoading(true);
      
      // Загружаем данные предмета
      const subjectData = await ScheduleService.getSubjectById(subjectId);
      setSubject(subjectData);
      
      // Загружаем занятия по этому предмету
      const allLessons = await ScheduleService.getAllLessons();
      const subjectLessons = allLessons.filter(lesson => lesson.subjectId === subjectId);
      setLessons(subjectLessons);
      
    } catch (error) {
      console.error('Error loading subject data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные предмета');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddGroup = () => {
    Alert.alert('Информация', 'Функция добавления группы будет реализована позже');
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') {
      return true; 
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Разрешение на запись файлов',
          message: 'Приложению нужно разрешение для сохранения файлов Excel',
          buttonNeutral: 'Спросить позже',
          buttonNegative: 'Отмена',
          buttonPositive: 'Разрешить',
        }
      );
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Ошибка запроса разрешения:', err);
      return false;
    }
  };

    const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Получаем все данные для экспорта
      const exportData = await ScheduleService.getAttendanceExportData(subjectId);
      
      if (!exportData || exportData.length === 0) {
        Alert.alert('Информация', 'Нет данных для экспорта');
        return;
      }

      // Создаем рабочую книгу Excel
      const wb = XLSX.utils.book_new();

      // Группируем данные по группам
      const groupedData = {};
      exportData.forEach(item => {
        const groupName = item.groupName || 'Без группы';
        if (!groupedData[groupName]) {
          groupedData[groupName] = [];
        }
        groupedData[groupName].push(item);
      });

      // Создаем вкладку для каждой группы в формате таблицы посещаемости
      Object.keys(groupedData).forEach(groupName => {
        const groupData = groupedData[groupName];
        
        // Получаем уникальные даты занятий для этой группы
        const uniqueDates = [...new Set(groupData.map(item => item.lessonDate))].filter(date => date).sort();
        
        // Получаем уникальных студентов для этой группы
        const uniqueStudents = [...new Set(groupData.map(item => item.studentName))].filter(name => name).sort();
        
        // Создаем матрицу данных для Excel
        const excelData = [];
        
        // Первая строка - заголовок с названием группы
        excelData.push([`Группа: ${groupName}`]);
        excelData.push([]); 
        
        // Заголовки таблицы
        const headers = ['ФИО', ...uniqueDates];
        excelData.push(headers);
        
        // Данные по каждому студенту
        uniqueStudents.forEach(studentName => {
          const row = [studentName];
          
          // Для каждой даты находим статус посещения этого студента
          uniqueDates.forEach(date => {
            const attendanceRecord = groupData.find(
              item => item.studentName === studentName && item.lessonDate === date
            );
            const status = attendanceRecord?.attendanceStatus === 'present' ? '+' : 
                          attendanceRecord?.attendanceStatus === 'absent' ? 'н' : '';
            row.push(status);
          });
          
          excelData.push(row);
        });
        
        // Создаем лист с данными
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Устанавливаем ширину колонок
        const colWidths = [
          { wch: 30 }, // ФИО студента
          ...uniqueDates.map(() => ({ wch: 8 })) // Даты занятий
        ];
        ws['!cols'] = colWidths;

        // Добавляем объединение ячеек для заголовка группы
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ 
          s: { r: 0, c: 0 }, 
          e: { r: 0, c: headers.length - 1 } 
        });

        const sheetName = groupName.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // Генерируем Excel файл в base64
      const wbout = XLSX.write(wb, { 
        type: 'base64', 
        bookType: 'xlsx' 
      });
      
      const fileName = `Посещаемость_${subjectName.replace(/\s+/g, '_')}.xlsx`;
      const fileUri = `${FileSystemLegacy.documentDirectory}${fileName}`;
      
      console.log('Создаем файл по пути:', fileUri);

      await FileSystemLegacy.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystemLegacy.EncodingType.Base64
      });
      
      console.log('Файл успешно создан');

      // Делимся файлом
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Сохранить посещаемость: ${subjectName}`
        });
      } else {
        Alert.alert('Успех', 'Файл готов к сохранению');
      }

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Ошибка', 'Не удалось экспортировать данные');
    } finally {
      setIsExporting(false);
    }
  };

  // Вспомогательная функция для atob
  const atob = (base64) => {
    try {
      if (typeof global.atob === 'function') {
        return global.atob(base64);
      }
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let output = '';
      let i = 0;
      
      base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');
      
      while (i < base64.length) {
        const enc1 = chars.indexOf(base64.charAt(i++));
        const enc2 = chars.indexOf(base64.charAt(i++));
        const enc3 = chars.indexOf(base64.charAt(i++));
        const enc4 = chars.indexOf(base64.charAt(i++));
        
        const chr1 = (enc1 << 2) | (enc2 >> 4);
        const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        const chr3 = ((enc3 & 3) << 6) | enc4;
        
        output += String.fromCharCode(chr1);
        if (enc3 !== 64) output += String.fromCharCode(chr2);
        if (enc4 !== 64) output += String.fromCharCode(chr3);
      }
      
      return output;
    } catch (e) {
      console.error('atob error:', e);
      throw new Error('Ошибка конвертации base64');
    }
  };
const btoa = (str) => {
  try {
    return Buffer.from(str, 'binary').toString('base64');
  } catch (e) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let i = 0;
    
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = str.charCodeAt(i++);
      const c = str.charCodeAt(i++);
      
      const index1 = a >> 2;
      const index2 = ((a & 3) << 4) | (b >> 4);
      const index3 = isNaN(b) ? 64 : ((b & 15) << 2) | (c >> 6);
      const index4 = isNaN(c) ? 64 : c & 63;
      
      output += chars.charAt(index1) + chars.charAt(index2) + chars.charAt(index3) + chars.charAt(index4);
    }
    
    return output;
  }
};

  const getDayName = (dayNumber) => {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    return days[dayNumber - 1] || 'Неизвестно';
  };

  const getWeekTypeText = (weekType) => {
    switch (weekType) {
      case 'numerator': return 'Числитель';
      case 'denominator': return 'Знаменатель';
      case 'both': return 'Каждую неделю';
      default: return 'Неизвестно';
    }
  };

  // Группируем занятия по дням недели
  const groupedLessons = lessons.reduce((acc, lesson) => {
    const day = lesson.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(lesson);
    return acc;
  }, {});

  // Получаем уникальные группы
  const uniqueGroups = [...new Set(lessons.map(lesson => lesson.group_name))].filter(Boolean);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Загрузка...</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Выйти</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка данных предмета...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{subjectName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Информация о группах */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Группы</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadSubjectData}
            >
              <Text style={styles.refreshButtonText}>⟳</Text>
            </TouchableOpacity>
          </View>
          
          {uniqueGroups.length > 0 ? (
            <View style={styles.groupsContainer}>
              {uniqueGroups.map((group, index) => (
                <View key={index} style={styles.groupChip}>
                  <Text style={styles.groupChipText}>{group}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Группы не добавлены</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddGroup}
          >
            <Text style={styles.addButtonText}>+ Добавить группу</Text>
          </TouchableOpacity>
        </View>

        {/* Расписание занятий */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Расписание занятий</Text>
          
          {lessons.length > 0 ? (
            
            <View style={styles.scheduleContainer}>
              <TouchableOpacity 
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={handleExport}
                disabled={isExporting}
              >
                <Text style={styles.exportButtonText}>
                  {isExporting ? 'Экспорт...' : 'Выгрузить посещаемость'}
                </Text>
              </TouchableOpacity>
              
              {Object.entries(groupedLessons).map(([day, dayLessons]) => (
                <View key={day} style={styles.daySection}>
                  <Text style={styles.dayTitle}>{getDayName(parseInt(day))}</Text>
                  
                  {dayLessons.map((lesson, index) => (
                    <View key={lesson.id || index} style={styles.lessonItem}>
                      <View style={styles.lessonTime}>
                        <Text style={styles.timeText}>
                          {lesson.startTime} - {lesson.endTime}
                        </Text>
                        <View style={[
                          styles.weekBadge,
                          lesson.weekType === 'numerator' ? styles.numeratorBadge : 
                          lesson.weekType === 'denominator' ? styles.denominatorBadge : 
                          styles.bothBadge
                        ]}>
                          <Text style={styles.weekBadgeText}>
                            {getWeekTypeText(lesson.weekType)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.lessonDetails}>
                        <Text style={styles.groupText}>Группа: {lesson.group_name}</Text>
                        {lesson.classroom && (
                          <Text style={styles.classroomText}>Аудитория: {lesson.classroom}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Нет запланированных занятий</Text>
              <Text style={styles.emptyStateSubtext}>
                Добавьте занятия через меню "Управление занятиями"
              </Text>
            </View>
          )}
        </View>

        {/* Статистика */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Статистика</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{lessons.length}</Text>
              <Text style={styles.statLabel}>Всего занятий</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{uniqueGroups.length}</Text>
              <Text style={styles.statLabel}>Групп</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {Object.keys(groupedLessons).length}
              </Text>
              <Text style={styles.statLabel}>Дней в неделю</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 24,
    color: '#4A306D',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A306D',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: 'rgba(139, 58, 98, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B3A62',
  },
  logoutButtonText: {
    color: '#8B3A62',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A306D',
  },
  refreshButton: {
    backgroundColor: 'rgba(92, 128, 188, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#5C80BC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  groupChip: {
    backgroundColor: '#4A306D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  groupChipText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A306D',
  },
  exportButton: {
    backgroundColor: '#4A306D',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  exportButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  scheduleContainer: {
    marginTop: 10,
  },
  daySection: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A306D',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lessonItem: {
    backgroundColor: '#F8F7FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4A306D',
  },
  lessonTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A306D',
  },
  weekBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  numeratorBadge: {
    backgroundColor: '#E1F5FE',
  },
  denominatorBadge: {
    backgroundColor: '#F3E5F5',
  },
  bothBadge: {
    backgroundColor: '#E8F5E8',
  },
  weekBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4A306D',
  },
  lessonDetails: {
    marginTop: 4,
  },
  groupText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  classroomText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A306D',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default SubjectDetailScreen;