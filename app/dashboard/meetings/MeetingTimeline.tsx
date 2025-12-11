import React from 'react';
import { motion } from 'framer-motion';

type Meeting = {
    id: number;
    name: string;
    desc: string;
    type: 'onsite' | 'online' | string;
    details: string;
    date: string;
    time: string;
    divisionId: number;
    Division: { name: string }
};

type MeetingTimelineProps = {
    meetings: Meeting[];
    attendanceStats: {
        percentage: number;
        present: number;
        total: number;
    };
};

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch (e) {
        return dateString;
    }
};

const formatTime = (timeString: string) => {
    try {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    } catch (e) {
        return timeString;
    }
}

export default function MeetingTimeline({ meetings, attendanceStats }: MeetingTimelineProps) {
    // Sort meetings by date (newest first for upcoming? or oldest first? Roadmap usually is chronological).
    // Let's do Ascending (oldest to newest) to show the journey.
    const sortedMeetings = [...meetings].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
    });

    return (
        <div className="relative w-full max-w-4xl mx-auto p-4 md:p-8">
            {/* --- Stats Card (Top Right) --- */}
            <div className="relative w-full flex justify-center mb-8 md:mb-0 md:absolute md:top-0 md:right-0 z-10 md:w-auto md:block">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-neutral-100 flex flex-col items-center justify-center w-48 backdrop-blur-md bg-opacity-90">
                    <div className="relative w-24 h-24 mb-2">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-neutral-200"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * attendanceStats.percentage) / 100}
                                className="text-primary-500 transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-neutral-800">{Math.round(attendanceStats.percentage)}%</span>
                        </div>
                    </div>
                    <p className="text-body-sm font-medium text-neutral-500 text-center">
                        Overall Attendance
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                        {attendanceStats.present} / {attendanceStats.total} Present
                    </p>
                </div>
            </div>

            <div className="mb-12 pt-4">
                {/* Spacer to avoid overlap with abs stats card on mobile if needed, or just let it float */}
                {/* Header is handled by parent page usually */}
            </div>

            {/* --- Timeline Container --- */}
            <div className="relative mt-8">
                {/* Vertical Line */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-neutral-200 transform md:-translate-x-1/2"></div>

                {/* --- Meeting Items --- */}
                <div className="space-y-12">
                    {sortedMeetings.map((meeting, index) => {
                        const isLeft = index % 2 === 0;
                        const isOnline = meeting.type.toLowerCase() === 'online';

                        return (
                            <motion.div
                                key={meeting.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`flex flex-col md:flex-row items-center w-full ${isLeft ? 'md:flex-row-reverse' : ''
                                    }`}
                            >
                                {/* Spacer for Desktop Alignment */}
                                <div className="hidden md:block w-1/2" />

                                {/* Timeline Dot */}
                                <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full border-4 border-white shadow-sm z-10 flex items-center justify-center transform -translate-x-1/2 bg-primary-500">
                                    {/* Icon based on type */}
                                    {isOnline ? (
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </div>

                                {/* Card */}
                                <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isLeft ? 'md:pr-12' : 'md:pl-12'}`}>
                                    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                                        {/* Decorative top bar */}
                                        <div className={`absolute top-0 left-0 right-0 h-1 ${isOnline ? 'bg-info' : 'bg-primary-500'}`} />

                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOnline ? 'bg-info/10 text-info' : 'bg-primary-50 text-primary-700'
                                                }`}>
                                                {isOnline ? 'Online' : 'Onsite'}
                                            </span>
                                            <span className="text-body-sm text-neutral-500 font-mono">
                                                {meeting.Division.name}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-neutral-800 mb-1 group-hover:text-primary-600 transition-colors">
                                            {meeting.name}
                                        </h3>
                                        <div className="flex items-center text-body-sm text-neutral-500 mb-3 space-x-3">
                                            <span className="flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {formatDate(meeting.date)}
                                            </span>
                                            <span className="flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatTime(meeting.time)}
                                            </span>
                                        </div>

                                        <p className="text-body-md text-neutral-600 mb-4">
                                            {meeting.desc}
                                        </p>

                                        <div className="pt-3 border-t border-neutral-100 flex items-center text-body-sm text-neutral-500">
                                            <svg className="w-4 h-4 mr-2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                {isOnline ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                )}
                                            </svg>
                                            <span className="truncate">{meeting.details}</span>
                                        </div>

                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* End of Timeline */}
                    {sortedMeetings.length > 0 && (
                        <div className="flex justify-center pt-8">
                            <div className="bg-neutral-100 text-neutral-500 px-4 py-1 rounded-full text-sm">
                                End of Meetings
                            </div>
                        </div>
                    )}
                    {sortedMeetings.length === 0 && (
                        <div className="text-center py-20 text-neutral-500">
                            No meetings found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
