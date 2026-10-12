import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { Tutorial, TutorialProps, timeline, FPS } from "./Tutorial";
import { LiveProps, LiveTutorial, liveSize, liveTimeline } from "./LiveTutorial";

const calculateMetadata: CalculateMetadataFunction<TutorialProps> = ({ props }) => ({
    durationInFrames: timeline(props.manifest).total,
});
const calculateLive: CalculateMetadataFunction<LiveProps> = ({ props }) => ({
    durationInFrames: liveTimeline(props.manifest).total,
    ...liveSize(props.manifest),
});

const SAMPLE: TutorialProps = {
    manifest: { id: "00", lang: "tj", title: "Намуна", next: null, scenes: [] },
};
const LIVE_SAMPLE: LiveProps = {
    manifest: { id: "06", lang: "tj", title: "Намуна", next: null, video: "live.mp4", videoDuration: 10, scenes: [] },
};

export const Root: React.FC = () => (
    <>
        <Composition id="Tutorial" component={Tutorial} fps={FPS} width={1920} height={1080} durationInFrames={300} defaultProps={SAMPLE} calculateMetadata={calculateMetadata} />
        <Composition id="LiveTutorial" component={LiveTutorial} fps={FPS} width={1920} height={1080} durationInFrames={300} defaultProps={LIVE_SAMPLE} calculateMetadata={calculateLive} />
    </>
);
