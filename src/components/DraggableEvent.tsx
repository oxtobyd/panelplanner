import React from 'react';
import { useDrag } from 'react-dnd';
import { InterviewEvent } from '../types';
import { Users, MapPin, X, Check } from 'lucide-react';
import { isSameDay } from 'date-fns';

interface DraggableEventProps {
  event: InterviewEvent;
  className?: string;
  onClick: () => void;
  currentDate: Date;
}

export const DraggableEvent: React.FC<DraggableEventProps> = ({ 
  event, 
  className,
  onClick, 
  currentDate 
}) => {
  // Handle availability events
  if (event.type === 'Availability') {
    const tooltipText = event.isAvailable 
      ? 'Available' 
      : `Unavailable${event.reason ? `: ${event.reason}` : ''}`;

    return (
      <div
        className={className}
        onClick={onClick}
        title={tooltipText}
      >
        <div className="flex items-center gap-1">
          {event.isAvailable ? (
            <Check className="w-3 h-3" />
          ) : (
            <X className="w-3 h-3" />
          )}
          <span className="font-medium">{event.secretary?.name}</span>
        </div>
      </div>
    );
  }

  // For Panel events, only enable dragging on the first day
  const isFirstDayOfPanel = event.type === 'Panel' && isSameDay(new Date(event.date), currentDate);
  const shouldEnableDrag = event.type !== 'Panel' || isFirstDayOfPanel;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EVENT',
    item: { event },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => shouldEnableDrag
  }));

  // Format time to show only HH:mm
  const formattedTime = event.time?.match(/\d{2}:\d{2}/)?.[0];

  return (
    <div
      ref={shouldEnableDrag ? drag : null}
      className={`${className} ${isDragging ? 'opacity-50' : ''} ${shouldEnableDrag ? 'cursor-move' : 'cursor-default'}`}
      onClick={onClick}
    >
      <div className="font-medium">{event.title || `${event.type} ${event.panelNumber}`}</div>
      {event.secretary && (
        <div className="flex items-center text-xs gap-1">
          <Users className="w-3 h-3" />
          {event.secretary.name}
        </div>
      )}
      {event.venue && (
        <div className="flex items-center text-xs gap-1">
          <MapPin className="w-3 h-3" />
          {event.venue.name}
          {event.type === 'Carousel' && formattedTime && ` (${formattedTime})`}
        </div>
      )}
    </div>
  );
}; 