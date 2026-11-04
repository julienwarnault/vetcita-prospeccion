import { requireChatGPTUser } from './chatgpt-auth';
import Dashboard from './inicio/dashboard';
export const dynamic = 'force-dynamic';
export default async function Home(){
  await requireChatGPTUser('/');
  return <Dashboard/>;
}
