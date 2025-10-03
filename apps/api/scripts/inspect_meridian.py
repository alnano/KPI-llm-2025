import joblib
import pandas as pd
import numpy as np
import pandas as pd
import xarray as xr
import matplotlib.pyplot as plt
from meridian.analysis.visualizer import MediaSummary, MediaEffects

# apps/api/data/sample_mmm.pkl
obj = joblib.load("apps/api/data/saved_mmm.pkl")
print(type(obj))
print(obj)
print(dir(obj), 'dir')
m = obj  # your loaded Merid
media_summary = MediaSummary(m)
# media_summary.plot_contribution_pie_chart()
df_contrib = media_summary.contribution_metrics()
print(df_contrib.head())

media_effects = MediaEffects(m)
df_response = media_effects.response_curves_data()
print(df_response.head())
