import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import chatService from '../services/chatService';
import multimodalService from '../services/multimodalService';

const AIChatTroubleshootScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    startNewChat();
  }, []);

  const startNewChat = async () => {
    try {

try {
        const guided = await multimodalService.startTroubleshoot({
          deviceType,
          deviceName,
          initialIssue: '',
        });
        const questions = guided?.questions || [];
        const hasOptions = questions.some((q) => Array.isArray(q.options) && q.options.length);
        if (questions.length && hasOptions) {
          navigation.replace('GuidedQuestions', { session: guided.session, questions });
          return;
        }
      } catch (_) {
        
      }

      const newSession = await chatService.startChat(deviceType, deviceName);
      setSession(newSession);
      setMessages(newSession.messages || []);
    } catch (error) {
      console.error('Start chat error:', error);
      alert('Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const userMessage = inputText.trim();
    setInputText('');
    setSending(true);

const tempMessage = {
      sender: 'user',
      text: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const updatedSession = await chatService.sendMessage(session._id, userMessage);
      setSession(updatedSession);
      setMessages(updatedSession.messages || []);

setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message. Please try again.');
      
      setMessages(prev => prev.filter(m => m !== tempMessage));
    } finally {
      setSending(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setInputText(suggestion);
  };

  const viewDiagnosis = () => {
    if (session.finalDiagnosis) {
      navigation.navigate('DiagnosticResult', {
        diagnosticId: session.finalDiagnosis
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Starting AI assistant...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Troubleshooting</Text>
          <Text style={styles.headerSubtitle}>{deviceName}</Text>
        </View>
        {session?.status === 'completed' && (
          <TouchableOpacity onPress={viewDiagnosis} style={styles.diagnosisButton}>
            <Ionicons name="document-text" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      {}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => (
          <View key={index}>
            <View style={[
              styles.messageBubble,
              message.sender === 'user' ? styles.userBubble : styles.aiBubble
            ]}>
              {message.sender === 'ai' && (
                <View style={styles.aiIcon}>
                  <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                </View>
              )}
              <View style={[
                styles.messageContent,
                message.sender === 'user' ? styles.userMessageContent : styles.aiMessageContent
              ]}>
                <Text style={[
                  styles.messageText,
                  message.sender === 'user' ? styles.userText : styles.aiText
                ]}>
                  {message.text}
                </Text>
                <Text style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>

            {}
            {message.sender === 'ai' && message.metadata?.suggestions && 
             message.metadata.suggestions.length > 0 && index === messages.length - 1 && (
              <View style={styles.suggestionsContainer}>
                {message.metadata.suggestions.map((suggestion, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionChip}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {sending && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <View style={styles.aiIcon}>
              <Ionicons name="sparkles" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDot2]} />
              <View style={[styles.typingDot, styles.typingDot3]} />
            </View>
          </View>
        )}
      </ScrollView>

      {}
      {session?.status === 'completed' && (
        <View style={styles.completionBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.completionText}>Diagnosis complete!</Text>
          <TouchableOpacity onPress={viewDiagnosis} style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Report</Text>
          </TouchableOpacity>
        </View>
      )}

      {}
      {session?.status === 'active' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.gray}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? COLORS.white : COLORS.gray} 
            />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SIZES.lg,
    paddingTop: SIZES.lg * 2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    marginRight: 16
  },
  headerInfo: {
    flex: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4
  },
  diagnosisButton: {
    padding: 8
  },
  messagesContainer: {
    flex: 1
  },
  messagesContent: {
    padding: SIZES.lg,
    paddingBottom: SIZES.lg * 2
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%'
  },
  messageContent: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    elevation: 1
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse'
  },
  aiBubble: {
    alignSelf: 'flex-start'
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  messageContent: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    elevation: 1
  },
  userMessageContent: {
    backgroundColor: COLORS.primary
  },
  aiMessageContent: {
    backgroundColor: COLORS.white
  },
  userText: {
    color: COLORS.white
  },
  aiText: {
    color: COLORS.text
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.gray,
    alignSelf: 'flex-end'
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 40,
    marginBottom: 16,
    gap: 8
  },
  suggestionChip: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    elevation: 1
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500'
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 4
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray,
    opacity: 0.4
  },
  typingDot2: {
    opacity: 0.6
  },
  typingDot3: {
    opacity: 0.8
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: SIZES.lg,
    gap: 12
  },
  completionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46'
  },
  viewButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  viewButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SIZES.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 15,
    color: COLORS.text
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.lightGray
  }
});

export default AIChatTroubleshootScreen;
