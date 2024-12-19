import { useDrag } from 'react-dnd';
import { InterviewEvent } from '../types';
import { Users, MapPin, ExternalLink } from 'lucide-react';
import { isSameDay } from 'date-fns';

interface DraggableEventProps {
  event: InterviewEvent;
  className?: string;
  onClick?: () => void;
  currentDate: Date;
}

export const DraggableEvent: React.FC<DraggableEventProps> = ({ event, className, onClick, currentDate }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EVENT',
    item: { event },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const isEventStartDate = isSameDay(new Date(event.date), currentDate);

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`
        ${className} 
        cursor-move w-full text-left text-xs mb-1 px-2 py-1 rounded-md
        ${event.type === 'Panel' && !isEventStartDate ? 'opacity-75' : ''}
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <div className="font-medium flex items-center justify-between">
        <span>
          {event.type === 'Panel' && !isEventStartDate ? '(cont.)' : ''}
          {event.type === 'Panel' || event.type === 'Carousel' 
            ? `${event.type} ${event.panelNumber}` 
            : event.type}
        </span>
        {(event.type === 'Panel' || event.type === 'Carousel') && event.helperPanelId && (
          <a
            href={`https://helper.oxtobyhome.co.uk/panels/${event.helperPanelId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-current hover:opacity-75"
            title="Open in Helper"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      {/* Only show details on the first day for Panel events */}
      {(!event.type.includes('Panel') || isEventStartDate) && (
        <div className="flex items-center gap-4 mt-1 text-[10px] text-gray-600">
          {event.secretary && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{event.secretary.name}</span>
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{event.venue.name}</span>
            </div>
          )}
          {event.time && (
            <span>
              {new Date(`2000-01-01T${event.time}`).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}; 