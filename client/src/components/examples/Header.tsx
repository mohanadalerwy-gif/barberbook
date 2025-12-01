import Header from '../Header';

export default function HeaderExample() {
  // todo: remove mock functionality
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'customer' as const,
  };

  return (
    <div className="w-full">
      <Header 
        user={mockUser} 
        onLogin={() => console.log('Login clicked')}
        onLogout={() => console.log('Logout clicked')}
      />
    </div>
  );
}
