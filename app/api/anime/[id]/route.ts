import {getDetail} from '@/lib/catalog';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(_request:Request,context:{params:Promise<{id:string}>}) {
  const {id}=await context.params;
  if(!/^\d{1,8}$/.test(id))return Response.json({error:'Invalid anime ID'},{status:400});
  try{return Response.json(await getDetail(id));}catch{return Response.json({error:'This anime could not be loaded. Please try again.'},{status:502});}
}
