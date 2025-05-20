import React, { useState } from 'react';
import { createGlobalStyle } from 'styled-components';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChatAlt2, HiMicrophone, HiSparkles, HiUserCircle, HiCog } from 'react-icons/hi';
import MessageInterface from './components/MessageInterface';
import VoiceInterface from './components/VoiceInterface';

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(150deg, #051937 0%, #082454 100%);
    color: #f0f4f8;
    min-height: 100vh;
    padding: 2rem;
    line-height: 1.6;
  }
  
  /* Add font faces */
  @font-face {
    font-family: 'Inter';
    src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  }
  
  @font-face {
    font-family: 'JetBrains Mono';
    src: url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
  }
`;

// Styled components
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 4rem);
  position: relative;
  overflow: hidden;
`;

const Header = styled.header`
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LogoIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  font-weight: bold;
  font-size: 24px;
`;

const LogoText = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  background: linear-gradient(90deg, #f0f4f8 0%, #93c5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const NavItem = styled.button`
  background: ${props => props.active ? 'rgba(59, 130, 246, 0.25)' : 'transparent'};
  color: ${props => props.active ? '#f0f4f8' : 'rgba(255, 255, 255, 0.6)'};
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.1)'};
  }
  
  svg {
    font-size: 1.2rem;
  }
  
  @media (max-width: 640px) {
    padding: 0.5rem;
    
    span {
      display: none;
    }
  }
`;

const MainContent = styled.main`
  flex-grow: 1;
  overflow: hidden;
  position: relative;
  height: calc(100vh - 200px);
`;

const Footer = styled.footer`
  text-align: center;
  padding: 1.5rem 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 1rem;
`;

const UserControls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const UserButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f0f4f8;
  }
  
  svg {
    font-size: 1.25rem;
  }
`;

// Animation variants
const pageVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

const App = () => {
  const [activePage, setActivePage] = useState('message');
  
  const handleNavChange = (page) => {
    setActivePage(page);
  };
  
  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Header>
          <Logo>
            <LogoIcon>V</LogoIcon>
            <LogoText>Virgil AI</LogoText>
          </Logo>
          
          <Navigation>
            <NavItem
              active={activePage === 'message'}
              onClick={() => handleNavChange('message')}
            >
              <HiChatAlt2 />
              <span>Chat</span>
            </NavItem>
            
            <NavItem
              active={activePage === 'voice'}
              onClick={() => handleNavChange('voice')}
            >
              <HiMicrophone />
              <span>Voice</span>
            </NavItem>
            
            <NavItem
              active={activePage === 'suggestions'}
              onClick={() => handleNavChange('suggestions')}
            >
              <HiSparkles />
              <span>Suggestions</span>
            </NavItem>
          </Navigation>
          
          <UserControls>
            <UserButton>
              <HiUserCircle />
            </UserButton>
            <UserButton>
              <HiCog />
            </UserButton>
          </UserControls>
        </Header>
        
        <MainContent>
          <AnimatePresence mode="wait">
            {activePage === 'message' && (
              <motion.div
                key="message-interface"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ height: '100%' }}
              >
                <MessageInterface />
              </motion.div>
            )}
            
            {activePage === 'voice' && (
              <motion.div
                key="voice-interface"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <VoiceInterface />
              </motion.div>
            )}
            
            {activePage === 'suggestions' && (
              <motion.div
                key="suggestions-interface"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ padding: '2rem', textAlign: 'center' }}
              >
                <h2>Suggestions</h2>
                <p style={{ margin: '1rem 0' }}>Coming soon! This feature will suggest topics and questions to explore with Virgil.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </MainContent>
        
        <Footer>
          Virgil AI Assistant © {new Date().getFullYear()} - Powered by advanced AI
        </Footer>
      </AppContainer>
    </>
  );
};

export default App; 