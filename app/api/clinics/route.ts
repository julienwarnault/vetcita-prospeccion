import { getDb } from '../../../db';
import { customClinics } from '../../../db/schema';
import { getChatGPTUser } from '../../chatgpt-auth';
export async function GET(){
  if(!await getChatGPTUser()) return Response.json({error:'No autorizado'},{status:401});
  try { const rows=await getDb().select().from(customClinics); return Response.json(rows.map(row=>JSON.parse(row.data))); }
  catch {return Response.json({error:'No se pudieron cargar las clínicas añadidas'},{status:500});}
}
export async function POST(req:Request){
  const user=await getChatGPTUser(); if(!user)return Response.json({error:'No autorizado'},{status:401});
  try {
    const raw=await req.json() as Record<string,unknown>;
    const field=(key:string,max=300)=>typeof raw[key]==='string'?(raw[key] as string).trim().slice(0,max):'';
    const name=field('name',200),address=field('address',500);
    if(!name||!address)return Response.json({error:'El nombre y la dirección son obligatorios'},{status:400});
    const lat=typeof raw.lat==='number'&&Number.isFinite(raw.lat)&&raw.lat>=-90&&raw.lat<=90?raw.lat:null;
    const lng=typeof raw.lng==='number'&&Number.isFinite(raw.lng)&&raw.lng>=-180&&raw.lng<=180?raw.lng:null;
    if((lat===null)!==(lng===null))return Response.json({error:'Ubicación inválida'},{status:400});
    const clinic={id:'manual-'+crypto.randomUUID(),name,address,borough:field('borough',100),neighborhood:field('neighborhood',150),phone:field('phone',80),category:field('category',150),website:'',hours:'',rating:null,lat,lng,verify:false,maps:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address),manual:true};
    await getDb().insert(customClinics).values({id:clinic.id,data:JSON.stringify(clinic),createdAt:new Date().toISOString(),author:user.email});
    return Response.json(clinic,{status:201});
  }catch{return Response.json({error:'No se pudo guardar la clínica'}, {status:500});}
}
