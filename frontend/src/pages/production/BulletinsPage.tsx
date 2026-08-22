import { useState, useEffect } from "react";
import { Plus, Search, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { PageHeader, DataCard, DataCardHeader, EmptyState, SkeletonTable, StatusBadge } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";

import { bulletinsApi, type OperationBulletin, type CreateBulletinDTO } from "../../features/bulletins/api";
import { BulletinForm } from "../../features/bulletins/BulletinForm";

import { stylesApi, type Style } from "../../features/styles/api";
import { operationsApi, type Operation } from "../../features/operations/api";

export function BulletinsPage() {
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bulData, styleData, opData] = await Promise.all([
        bulletinsApi.getBulletins(),
        stylesApi.getStyles(),
        operationsApi.getOperations(),
      ]);
      setBulletins(bulData);
      setStyles(styleData);
      setOperations(opData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (data: CreateBulletinDTO) => {
    await bulletinsApi.createBulletin(data);
    setIsFormOpen(false);
    loadData();
  };

  const filteredBulletins = bulletins.filter(b => 
    b.bulletinCode.toLowerCase().includes(search.toLowerCase()) || 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-7 w-full p-6 lg:p-8">
      <PageHeader
        eyebrow="Production"
        title="Operation Bulletins"
        description="Define standard operation sequences and SMVs. One bulletin can be attached to multiple identical styles."
        action={
          !isFormOpen && (
            <Button onClick={() => setIsFormOpen(true)} size="md">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Bulletin
            </Button>
          )
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Create Operation Bulletin"
        subtitle="Define the sequential flow of operations."
        className="max-w-4xl"
      >
        <BulletinForm styles={styles} operations={operations} onSubmit={handleSubmit} onCancel={() => setIsFormOpen(false)} />
      </Modal>

      <DataCard noPad>
        <DataCardHeader 
          title="Bulletin Library" 
          count={filteredBulletins.length} 
          action={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C7E6E]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bulletins..."
                className="pl-8 pr-4 py-1.5 text-[11px] bg-white border border-[#E6DDCE] text-[#221912] placeholder-[#B8A898] w-64 focus:outline-none focus:border-[#B48259] focus:ring-1 focus:ring-[#B48259]/20 transition-all rounded-sm"
              />
            </div>
          }
        />
        
        {loading ? (
          <SkeletonTable rows={4} cols={5} />
        ) : filteredBulletins.length === 0 ? (
          <EmptyState icon={<FileText className="h-6 w-6 text-[#E6DDCE]" />} title="No bulletins found" description="Create a bulletin to define your first operation sequence." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Bulletin Code</TableHead>
                <TableHead>Name & Details</TableHead>
                <TableHead>Linked Styles</TableHead>
                <TableHead className="w-32 text-right">Total SMV</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBulletins.map((bulletin, index) => (
                <motion.tr
                  key={bulletin.id}
                  className="group bg-white hover:bg-[#FEFCF9] border-b border-[#F0EAE0] last:border-0 transition-colors duration-100 cursor-pointer"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                >
                  <TableCell>
                    <span className="font-mono text-sm font-bold text-[#221912] tracking-wide">{bulletin.bulletinCode}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#B48259] text-sm">{bulletin.name}</span>
                      <span className="text-[10px] text-[#8C7E6E] mt-0.5">{bulletin.lines.length} Operations • v{bulletin.version}.0</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(bulletin.styles || []).slice(0, 3).map(style => (
                        <span key={style.id} className="inline-block px-1.5 py-0.5 rounded-sm bg-[#FAFAF8] border border-[#E6DDCE] text-[9px] font-mono font-semibold text-[#475569]">
                          {style.styleNo}
                        </span>
                      ))}
                      {(bulletin.styles || []).length > 3 && (
                        <span className="inline-block px-1.5 py-0.5 rounded-sm bg-[#FAFAF8] border border-[#E6DDCE] text-[9px] font-mono font-semibold text-[#8C7E6E]">
                          +{(bulletin.styles || []).length - 3} more
                        </span>
                      )}
                      {(bulletin.styles || []).length === 0 && (
                        <span className="text-[10px] text-[#B8A898] italic">No styles linked</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-bold text-[#3C5245] text-sm">{(bulletin.totalSmv || 0).toFixed(2)}</span>
                    <span className="text-[9px] text-[#8C7E6E] ml-1">min</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge 
                      status={bulletin.status === 'PUBLISHED' ? 'active' : bulletin.status === 'ARCHIVED' ? 'inactive' : 'present'} 
                      label={bulletin.status} 
                    />
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>
    </div>
  );
}



