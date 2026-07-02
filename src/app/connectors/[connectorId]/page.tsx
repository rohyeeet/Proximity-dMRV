import { notFound } from "next/navigation";
import { getConnector, getDevicesByConnector } from "@/data";
import { ConnectorStatusChip } from "@/components/ui/StatusChip";
import { DeviceCard } from "@/components/connectors/DeviceCard";

export default async function ConnectorDetailPage({ params }: { params: Promise<{ connectorId: string }> }) {
  const { connectorId } = await params;
  const connector = getConnector(connectorId);
  if (!connector) notFound();
  const connectorDevices = getDevicesByConnector(connectorId);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-ink">{connector.name}</h1>
            <ConnectorStatusChip status={connector.status} />
          </div>
          {connector.endpoint && <p className="mt-0.5 font-mono text-[12.5px] text-ink-soft">{connector.endpoint}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {connectorDevices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
        {connectorDevices.length === 0 && <p className="text-sm text-ink-soft">No devices registered on this connector yet.</p>}
      </div>
    </div>
  );
}
